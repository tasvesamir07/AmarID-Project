import {
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { createDecipheriv, createCipheriv, createHmac, randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AeadService } from '../../common/crypto/aead.service';

/**
 * Protected biometric templates (mock matcher, honest about limits).
 *
 * - Raw capture is never persisted.
 * - A deterministic 256-bit "sketch" is derived (BioHashing-style random
 *   projection) so the same capture yields the same sketch.
 * - The sketch is stored as AES-256-GCM ciphertext under the DEK.
 * - Matching compares decrypted sketches via Hamming similarity.
 *
 * This is a demo-grade cancelable template. Production requires a certified
 * biometric engine, HSM, and ISO/IEC 24745 evaluation (see docs/THREAT-MODEL.md).
 */
@Injectable()
export class BiometricsService {
  private readonly logger = new Logger(BiometricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aead: AeadService,
  ) {}

  private sketch(raw: Buffer): Buffer {
    const out = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      const h = createHmac('sha256', this.aeadDek())
        .update(Buffer.from([i]))
        .update(raw)
        .digest();
      out[i] = h[0];
    }
    return out;
  }

  private aeadDek(): Buffer {
    const hex = process.env.ENC_DEK_HEX;
    if (!hex || hex.length !== 64) return Buffer.alloc(32, 7);
    return Buffer.from(hex, 'hex');
  }

  /** Produce a protected template blob from a raw capture. */
  protectTemplate(raw: Buffer): Buffer {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.aeadDek(), nonce);
    const plain = this.sketch(raw);
    const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([nonce, tag, enc]);
  }

  private decrypt(blob: Buffer): Buffer | null {
    try {
      const nonce = blob.subarray(0, 12);
      const tag = blob.subarray(12, 28);
      const enc = blob.subarray(28);
      const decipher = createDecipheriv('aes-256-gcm', this.aeadDek(), nonce);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(enc), decipher.final()]);
    } catch {
      return null;
    }
  }

  /** Hamming similarity between two protected templates, 0..1. */
  compare(a: Buffer, b: Buffer): number {
    const da = this.decrypt(a);
    const db = this.decrypt(b);
    if (!da || !db || da.length === 0 || db.length === 0) return 0;
    const len = Math.min(da.length, db.length);
    let sameBits = 0;
    for (let i = 0; i < len; i++) {
      const x = da[i] ^ db[i];
      sameBits += 8 - this.popcount(x);
    }
    return sameBits / (len * 8);
  }

  private popcount(byte: number): number {
    let n = byte;
    let count = 0;
    while (n) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }

  async enrollTemplate(
    identityId: string,
    modality: 'FACE' | 'FINGER' | 'face' | 'finger',
    protectedBlob: Buffer,
    keyVersion = 1,
  ) {
    const m = (modality.toUpperCase() as 'FACE' | 'FINGER');
    return this.prisma.bioTemplate.create({
      data: { identityId, modality: m, protectedBlob, keyVersion },
    });
  }

  async getTemplates(identityId: string) {
    return this.prisma.bioTemplate.findMany({
      where: { identityId },
      select: { id: true, modality: true, keyVersion: true, createdAt: true },
    });
  }

  /**
   * 1:N deduplication against all enrolled protected templates of a modality.
   * `identityId` may be a sentinel (e.g. all-zero UUID) for a new enrollment.
   */
  async dedup(
    identityId: string,
    modality: 'FACE' | 'FINGER' | 'face' | 'finger',
    probe: Buffer,
  ): Promise<{ duplicate: boolean; bestScore: number; ambiguous: boolean }> {
    const m = (modality.toUpperCase() as 'FACE' | 'FINGER');
    const templates = await this.prisma.bioTemplate.findMany({
      where: { modality: m },
      select: { identityId: true, protectedBlob: true },
    });

    const threshold = m === 'FACE' ? 0.85 : 0.9;
    const ambiguousBand = 0.05;
    let bestScore = 0;
    let bestIdentity: string | null = null;

    for (const t of templates) {
      if (t.identityId === identityId) continue;
      const score = this.compare(probe, t.protectedBlob);
      if (score > bestScore) {
        bestScore = score;
        bestIdentity = t.identityId;
      }
    }

    if (bestScore >= threshold && bestIdentity && bestIdentity !== identityId) {
      throw new ConflictException('DUPLICATE_BIOMETRIC');
    }

    return {
      duplicate: false,
      bestScore,
      ambiguous: Math.abs(bestScore - threshold) < ambiguousBand,
    };
  }
}

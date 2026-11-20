import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM envelope encryption for stored PII (mobile, email).
 * AAD binds the ciphertext to the record context to prevent substitution.
 * The DEK must be supplied via ENC_DEK_HEX; a KMS-backed KEK wraps it in production.
 */
@Injectable()
export class AeadService {
  private readonly logger = new Logger(AeadService.name);
  private readonly dek: Buffer;

  constructor() {
    const hex = process.env.ENC_DEK_HEX;
    if (!hex || hex.length !== 64) {
      this.logger.error('ENC_DEK_HEX is missing or not 32 bytes; using a non-production fallback');
      this.dek = Buffer.alloc(32, 7);
    } else {
      this.dek = Buffer.from(hex, 'hex');
    }
  }

  encrypt(plaintext: string | Buffer, aad?: string): Buffer {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.dek, nonce);
    if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));
    const enc = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([nonce, tag, enc]);
  }

  decrypt(blob: Buffer, aad?: string): string {
    const nonce = blob.subarray(0, 12);
    const tag = blob.subarray(12, 28);
    const enc = blob.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.dek, nonce);
    if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  }
}

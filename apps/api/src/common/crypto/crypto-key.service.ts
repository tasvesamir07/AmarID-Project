import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

/**
 * Manages the ES256 signing keypair used for access tokens and JWKS.
 *
 * Key resolution order:
 *   1. JWT_PRIVATE_KEY_PEM / JWT_PUBLIC_KEY_PEM env vars (inline PEM)
 *   2. JWT_PRIVATE_KEY_PEM_PATH / JWT_PUBLIC_KEY_PEM_PATH env vars (file paths)
 *   3. Generated on first boot and persisted under `<cwd>/config/`
 *
 * The generated dev keypair is explicitly NON-PRODUCTION. A real deployment must
 * inject keys from a KMS/Vault and rotate them (see docs/THREAT-MODEL.md T9).
 */
@Injectable()
export class CryptoKeyService implements OnModuleInit {
  private readonly logger = new Logger(CryptoKeyService.name);
  private privateKeyPem = '';
  private publicKeyPem = '';
  private kid = 'amarid-es256-v1';

  onModuleInit(): void {
    const inlinePriv = process.env.JWT_PRIVATE_KEY_PEM;
    const inlinePub = process.env.JWT_PUBLIC_KEY_PEM;

    if (inlinePriv && inlinePub) {
      this.privateKeyPem = inlinePriv.replace(/\\n/g, '\n');
      this.publicKeyPem = inlinePub.replace(/\\n/g, '\n');
      this.logger.log('Loaded ES256 signing keys from environment');
      return;
    }

    const privPath = this.resolveKeyPath(
      process.env.JWT_PRIVATE_KEY_PEM_PATH,
      'jwt-es256-private.pem',
    );
    const pubPath = this.resolveKeyPath(
      process.env.JWT_PUBLIC_KEY_PEM_PATH,
      'jwt-es256-public.pem',
    );

    if (existsSync(privPath) && existsSync(pubPath)) {
      this.privateKeyPem = readFileSync(privPath, 'utf8');
      this.publicKeyPem = readFileSync(pubPath, 'utf8');
      this.logger.log('Loaded ES256 signing keys from disk');
      return;
    }

    this.logger.warn(
      'No ES256 keys configured — generating an ephemeral dev keypair. DO NOT use this in production.',
    );
    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
    });
    this.privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    this.publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

    try {
      mkdirSync(dirname(privPath), { recursive: true });
      writeFileSync(privPath, this.privateKeyPem, { mode: 0o600 });
      writeFileSync(pubPath, this.publicKeyPem, { mode: 0o644 });
      this.logger.log(`Persisted generated dev keypair to ${privPath}`);
    } catch (err) {
      this.logger.error(`Could not persist dev keypair: ${(err as Error).message}`);
    }
  }

  private resolveKeyPath(envPath: string | undefined, fallback: string): string {
    if (envPath) {
      return isAbsolute(envPath) ? envPath : resolve(process.cwd(), envPath);
    }
    return resolve(process.cwd(), 'config', fallback);
  }

  getPrivateKeyPem(): string {
    return this.privateKeyPem;
  }

  getPublicKeyPem(): string {
    return this.publicKeyPem;
  }

  getKeyId(): string {
    return this.kid;
  }

  isDevKey(): boolean {
    return !process.env.JWT_PRIVATE_KEY_PEM && !process.env.JWT_PRIVATE_KEY_PEM_PATH;
  }
}

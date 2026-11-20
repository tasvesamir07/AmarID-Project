import { Global, Module } from '@nestjs/common';
import { CryptoKeyService } from './crypto-key.service';
import { AeadService } from './aead.service';

@Global()
@Module({
  providers: [CryptoKeyService, AeadService],
  exports: [CryptoKeyService, AeadService],
})
export class CryptoKeyModule {}

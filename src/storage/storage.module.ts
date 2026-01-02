import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';

export const STORAGE_SERVICE = 'STORAGE_SERVICE';

@Module({
  imports: [ConfigModule],
  providers: [
    S3StorageService,
    LocalStorageService,
    {
      provide: STORAGE_SERVICE,
      inject: [ConfigService, S3StorageService, LocalStorageService],
      useFactory: (
        config: ConfigService,
        s3: S3StorageService,
        local: LocalStorageService,
      ) => {
        const driver = config.get<string>('STORAGE_DRIVER');
        return driver === 'local' ? local : s3;
      },
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}

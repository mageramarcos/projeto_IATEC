import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.uploadDir = join(process.cwd(), 'uploads');
  }

  async upload(file: Express.Multer.File, key?: string): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const fileName = key ?? `${Date.now()}-${file.originalname}`;
    const filePath = join(this.uploadDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    const baseUrl =
      this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    return `${baseUrl}/uploads/${fileName}`;
  }
}

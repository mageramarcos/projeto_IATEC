export abstract class StorageService {
  abstract upload(file: Express.Multer.File, key?: string): Promise<string>;
}

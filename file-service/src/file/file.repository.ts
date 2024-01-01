import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File } from './schemas/file.schema';
import Repository from '../database/Repository';

@Injectable()
export class FileRepository extends Repository<File> {
  constructor(@InjectModel(File.name) private fileModel: Model<File>) {
    super(fileModel);
  }
}

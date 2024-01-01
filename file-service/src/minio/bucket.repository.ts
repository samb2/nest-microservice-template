import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Repository from '../database/Repository';
import { Bucket } from './schemas/bucket.schema';

@Injectable()
export class BucketRepository extends Repository<Bucket> {
  constructor(@InjectModel(Bucket.name) private bucketModel: Model<Bucket>) {
    super(bucketModel);
  }
}

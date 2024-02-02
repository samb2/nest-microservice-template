import {
  Document,
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';
import { ICache } from './cache.interface';
import { PaginationOptions } from './pagination.interface';

export interface IRepository<T extends Document> {
  find(
    where: FilterQuery<T>,
    projection?: ProjectionType<T> | null | undefined,
    options?: QueryOptions<T> | null | undefined,
    cache?: ICache | undefined,
  ): Promise<T[]>;

  findOne(
    where?: FilterQuery<T>,
    projection?: ProjectionType<T> | null,
    options?: QueryOptions<T> | null,
    cache?: ICache | undefined,
  ): Promise<T>;

  findById(
    id: Types.ObjectId,
    projection?: ProjectionType<T> | null,
    options?: QueryOptions<T> | null,
    cache?: ICache | undefined,
  ): Promise<any>;

  paginate(
    where?: FilterQuery<T>,
    projection?: ProjectionType<T> | null,
    options?: PaginationOptions,
    cache?: ICache | undefined,
  ): Promise<T>;

  update(
    where?: FilterQuery<T>,
    update?: UpdateQuery<T> | UpdateWithAggregationPipeline,
    options?: QueryOptions<T> | null,
  ): Promise<T>;

  updateMany(
    where?: FilterQuery<T>,
    update?: UpdateQuery<T> | UpdateWithAggregationPipeline,
    options?: QueryOptions<T> | null,
  ): Promise<T>;

  findByIdAndUpdate(
    id?: Types.ObjectId | any,
    update?: UpdateQuery<T>,
    options?: QueryOptions<T> | null,
  ): Promise<Model<T>>;

  findOneAndUpdate(
    where?: FilterQuery<T>,
    update?: UpdateQuery<T>,
    options?: QueryOptions<T> | null,
  ): Promise<Model<T>>;

  deleteMany(where?: FilterQuery<T>, options?: QueryOptions<T>): Promise<any>;

  findByIdAndDelete(
    id: Types.ObjectId,
    options?: QueryOptions<T> & {
      includeResultMetadata: true;
    },
  ): Promise<any>;

  findOneAndDelete(
    where?: FilterQuery<T> | null,
    options?: QueryOptions<T> | null,
  ): Promise<any>;

  insert(value: Partial<T>): Promise<any>;

  insertMany(values: Partial<T>[], options: any): Promise<any>;

  insertWithoutSave(value: Partial<T>): Promise<T>;
}

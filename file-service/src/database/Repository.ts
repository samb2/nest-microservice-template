import {
  Document,
  FilterQuery,
  InsertManyOptions,
  Model,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';
import { ICache } from './interfaces/cache.interface';
import { PaginationOptions } from './interfaces/pagination.interface';
import { IRepository } from './interfaces/repository.interface';

export default class Repository<T extends Document> implements IRepository<T> {
  constructor(private readonly model: Model<T>) {}

  // Find
  async find(
    where: FilterQuery<T>,
    projection?: ProjectionType<T> | null | undefined,
    options?: QueryOptions<T> | null | undefined,
    cache: ICache | undefined = undefined,
  ): Promise<T[]> {
    if (cache) {
      return this.model.find(where, projection, options);
    }
    return this.model.find(where, projection, options).exec();
  }

  async findOne(
    where?: FilterQuery<T>,
    projection?: ProjectionType<T> | null,
    options?: QueryOptions<T> | null,
    cache: ICache | undefined = undefined,
  ): Promise<T> {
    if (cache) {
      return this.model.findOne(where, projection, options);
    }
    return this.model.findOne(where, projection, options).exec();
  }

  async findById(
    id: Types.ObjectId,
    projection?: ProjectionType<T> | null,
    options?: QueryOptions<T> | null,
    cache: ICache | undefined = undefined,
  ): Promise<any> {
    if (cache) {
      return this.model.findById(id, projection, options);
    }
    return this.model.findById(id, projection, options).exec();
  }

  async paginate(
    where?: FilterQuery<T>,
    projection?: ProjectionType<T> | null,
    options?: PaginationOptions,
    cache: ICache | undefined = undefined,
  ): Promise<any> {
    const { limit, page } = options;
    let results: any;

    const skip = (page - 1) * limit;

    if (cache) {
      results = await this.model.find(where, projection, { ...options, skip });
    } else {
      results = await this.model
        .find(where, projection, { ...options, skip })
        .exec();
    }

    const count: number = await this.model.countDocuments(where);

    const totalPages: number = Math.ceil(count / limit);

    return {
      results,
      count,
      totalPages,
      page,
      limit,
    };
  }

  // Update
  async update(
    where?: FilterQuery<T>,
    update?: UpdateQuery<T> | UpdateWithAggregationPipeline,
    options?: QueryOptions<T> | null,
  ): Promise<any> {
    return this.model.updateOne(where, update, options);
  }

  async updateMany(
    where?: FilterQuery<T>,
    update?: UpdateQuery<T> | UpdateWithAggregationPipeline,
    options?: QueryOptions<T> | null,
  ): Promise<any> {
    return this.model.updateMany(where, update, options);
  }

  async findByIdAndUpdate(
    id?: Types.ObjectId | any,
    update?: UpdateQuery<T>,
    options?: QueryOptions<T> | null,
  ): Promise<Model<T>> {
    return this.model.findByIdAndUpdate(id, update, options);
  }

  async findOneAndUpdate(
    where?: FilterQuery<T>,
    update?: UpdateQuery<T>,
    options?: QueryOptions<T> | null,
  ): Promise<Model<T>> {
    return this.model.findOneAndUpdate(where, update, options);
  }

  // Delete
  async deleteMany(
    where?: FilterQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<any> {
    return this.model.deleteMany(where, options);
  }

  async findByIdAndDelete(
    id: Types.ObjectId,
    options?: QueryOptions<T> & {
      includeResultMetadata: true;
    },
  ): Promise<any> {
    return this.model.findByIdAndDelete(id, options);
  }

  async findOneAndDelete(
    where?: FilterQuery<T> | null,
    options?: QueryOptions<T> | null,
  ): Promise<any> {
    return this.model.findOneAndDelete(where, options);
  }

  // Insert
  async insert(value: Partial<T>): Promise<T> {
    return this.model.create(value);
  }

  async insertMany(
    values: Partial<T>[],
    options: InsertManyOptions & { lean: true },
  ): Promise<any> {
    return this.model.insertMany(values, options);
  }

  async insertWithoutSave(value: Partial<T>): Promise<T> {
    return new this.model(value);
  }
}

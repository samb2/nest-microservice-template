import { Document, Model, Types } from 'mongoose';

interface IPopulate {
  path: string;
  model: string;
  select?: [] | string;
  populate?: IPopulate;
}

interface IOption {
  sort?: object;
  limit?: number;
  skip?: number;
  populate?: [IPopulate] | string;
  lean?: boolean;
}

interface IInsertManyOption {
  ordered?: boolean;
  lean?: boolean;
}

interface ICache {
  cacheKey?: string;
  ttl?: number;
  multitenantValue?: string;
}

interface PaginationOptions {
  select?: string;
  sort?: object;
  limit: number;
  page: number;
  populate?: [IPopulate] | string;
  lean?: boolean;
}

interface IRepository<T extends Document> {
  find(
    where: object,
    projection: object,
    options: IOption,
    cache: ICache | undefined,
  ): Promise<T[]>;

  findOne(
    where: object,
    projection: object,
    options: IOption,
    cache: ICache | undefined,
  ): Promise<T>;

  findById(
    id: Types.ObjectId,
    projection: object,
    options: IOption,
    cache: ICache | undefined,
  ): Promise<T>;

  paginate(
    where: object,
    projection: object,
    options: PaginationOptions,
    cache: ICache | undefined,
  ): Promise<T>;

  update(where: object, update: Partial<T>): Promise<T>;

  updateMany(where: object, update: Partial<T>): Promise<T>;

  findByIdAndUpdate(id: Types.ObjectId, update: Partial<T>): Promise<T>;

  findOneAndUpdate(where: object, update: Partial<T>): Promise<T>;

  deleteMany(where: object): Promise<T>;

  findByIdAndDelete(id: Types.ObjectId): Promise<T>;

  findOneAndDelete(where: object): Promise<T>;

  insert(value: Partial<T>): Promise<T>;

  insertMany(values: Partial<T>[], options: IInsertManyOption): Promise<T>;

  insertWithoutSave(value: Partial<T>): Promise<T>;
}

export default class Repository<T extends Document> implements IRepository<T> {
  constructor(private readonly model: Model<T>) {}

  // Find
  async find(
    where: object,
    projection: object = {},
    options: IOption = {},
    cache: ICache | undefined = undefined,
  ): Promise<any[]> {
    if (cache) {
      return this.model.find(where, projection, options);
    }
    return this.model.find(where, projection, options).exec();
  }

  async findOne(
    where: object,
    projection: object = {},
    options: IOption = {},
    cache: ICache | undefined = undefined,
  ): Promise<any> {
    if (cache) {
      return this.model.findOne(where, projection, options);
    }
    return this.model.findOne(where, projection, options).exec();
  }

  async findById(
    id: Types.ObjectId,
    projection: object = {},
    options: IOption = {},
    cache: ICache | undefined = undefined,
  ): Promise<any> {
    if (cache) {
      return this.model.findById(id, projection, options);
    }
    return this.model.findById(id, projection, options).exec();
  }

  async paginate(
    where: object = {},
    projection: object = {},
    options: PaginationOptions,
    cache: ICache | undefined = undefined,
  ): Promise<any> {
    const { limit, page } = options;
    let results;

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
  async update(where: object, update: Partial<T>): Promise<any> {
    return this.model.updateOne(where, update);
  }

  async updateMany(where: object, update: Partial<T>): Promise<any> {
    return this.model.updateMany(where, update);
  }

  async findByIdAndUpdate(
    id: Types.ObjectId,
    update: Partial<T>,
  ): Promise<any> {
    return this.model.findByIdAndUpdate(id, update);
  }

  async findOneAndUpdate(where: object, update: Partial<T>): Promise<any> {
    return this.model.findOneAndUpdate(where, update);
  }

  // Delete
  async deleteMany(where: object): Promise<any> {
    return this.model.deleteMany(where);
  }

  async findByIdAndDelete(id: Types.ObjectId): Promise<any> {
    return this.model.findByIdAndDelete(id);
  }

  async findOneAndDelete(where: object): Promise<any> {
    return this.model.findOneAndDelete(where);
  }

  // Insert
  async insert(value: Partial<T>): Promise<T> {
    return this.model.create(value);
  }

  async insertMany(
    values: Partial<T>[],
    options: IInsertManyOption = {},
  ): Promise<any> {
    return this.model.insertMany(values, options);
  }

  async insertWithoutSave(value: Partial<T>): Promise<T> {
    return new this.model(value);
  }
}

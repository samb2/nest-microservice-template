// mongoid-validation.pipe.ts
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class MongoIdValidationPipe implements PipeTransform<any> {
  async transform(value: any): Promise<any> {
    if (Types.ObjectId.isValid(value)) {
      if (String(new Types.ObjectId(value)) === value) return value;
      throw new BadRequestException('Id validation fail');
    }
    throw new BadRequestException('Id validation fail');
  }
}

// uuid-validation.pipe.ts
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class UuidValidationPipe implements PipeTransform<any> {
  async transform(value: any): Promise<any> {
    if (!value) {
      throw new BadRequestException('Parameter is empty');
    }

    const uuidRegExp =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

    if (!uuidRegExp.test(value)) {
      throw new BadRequestException('Invalid UUID format');
    }

    return value;
  }
}

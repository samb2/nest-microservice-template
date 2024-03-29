import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

const statusMessages = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'NonAuthoritativeInfo',
  204: 'NoContent',
  205: 'ResetContent',
  206: 'PartialContent',
};

class SuccessResponseDto<T> {
  from: string = 'AUTH-SERVICE';
  success: boolean;
  statusCode: string;
  message: string;
  data: T;
}

export const ApiOkResponseSuccess = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
  status: number,
  isArray: boolean = false,
) =>
  applyDecorators(
    ApiExtraModels(SuccessResponseDto, dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResponseDto) },
          {
            properties: {
              from: {
                type: 'string',
                default: 'AUTH-SERVICE',
              },
              success: {
                type: 'true',
                default: 'true',
              },
              statusCode: {
                type: 'number',
                default: status,
              },
              message: {
                type: 'number',
                default: statusMessages[status],
              },
              data: isArray
                ? {
                    items: { $ref: getSchemaPath(dataDto) },
                  }
                : {
                    $ref: getSchemaPath(dataDto),
                  },
            },
          },
        ],
      },
    }),
  );

import { IPopulate } from './populate.inteface';

export interface PaginationOptions {
  select?: string;
  sort?: object;
  limit: number;
  page: number;
  populate?: [IPopulate] | string;
  lean?: boolean;
}

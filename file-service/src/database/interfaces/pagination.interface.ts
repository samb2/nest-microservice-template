import { IPopulate } from './populate.inteface';

export interface PaginationOptions {
  select?: string;
  sort?: object;
  take: number;
  page: number;
  populate?: [IPopulate] | string;
  lean?: boolean;
}

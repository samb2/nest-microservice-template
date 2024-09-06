export interface PaginateResponseInterface<T> {
  results: T;
  itemCount: number;
  pageCount: number;
  page: number;
  take: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

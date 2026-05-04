import { PageMetadata } from './page-metadata.interface';

export interface PagedResponse<T> {
  data: T[];
  page: PageMetadata;
}

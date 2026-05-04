import { PageMetadata } from '../interfaces/page-metadata.interface';
import { AccountListFilters } from '../interfaces/account-list-filters.interface';

export function paginationFromHeaders(headers: Headers, fallback: AccountListFilters): PageMetadata {
  const page = headerNumber(headers, 'x-page', fallback.page);
  const pageSize = Math.max(1, headerNumber(headers, 'x-page-size', fallback.pageSize));
  const totalCount = headerNumber(headers, 'x-total-count', 0);
  const totalPages = headerNumber(headers, 'x-total-pages', Math.max(1, Math.ceil(totalCount / pageSize)));
  
  return {
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

function headerNumber(headers: Headers, name: string, fallback: number): number {
  const value = headers.get(name);
  
  const parsedValue = value ? Number(value) : NaN;

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

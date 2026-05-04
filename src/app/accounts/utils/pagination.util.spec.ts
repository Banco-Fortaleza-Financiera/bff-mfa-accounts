import { paginationFromHeaders } from './pagination.util';

describe('paginationFromHeaders', () => {
  it('uses pagination headers when they are present', () => {
    const headers = new Headers({
      'x-page': '2',
      'x-page-size': '25',
      'x-total-count': '60',
      'x-total-pages': '3',
    });

    const page = paginationFromHeaders(headers, { page: 1, pageSize: 10 });

    expect(page).toEqual({
      totalCount: 60,
      page: 2,
      pageSize: 25,
      totalPages: 3,
    });
  });

  it('falls back to filter values and calculates total pages', () => {
    const headers = new Headers({
      'x-total-count': '21',
    });

    const page = paginationFromHeaders(headers, { page: 3, pageSize: 10 });

    expect(page).toEqual({
      totalCount: 21,
      page: 3,
      pageSize: 10,
      totalPages: 3,
    });
  });

  it('keeps page size at least one', () => {
    const page = paginationFromHeaders(new Headers(), { page: 1, pageSize: 0 });

    expect(page.pageSize).toBe(1);
    expect(page.totalPages).toBe(1);
  });
});

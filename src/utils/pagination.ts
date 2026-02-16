import { PaginationMeta } from '../dtos/transaction.dto';

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export function paginate<T>(items: T[], page: number, limit: number): PaginatedResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);

  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

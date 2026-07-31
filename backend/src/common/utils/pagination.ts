import { PaginationQuery } from '../types';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export const parsePagination = (query: PaginationQuery): PaginationOptions => {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;
  
  const sortField = query.sort || 'createdAt';
  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

  return { page, limit, skip, sort };
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number
) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

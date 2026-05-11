type PaginationInput = {
  page?: number;
  limit?: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const normalizePagination = ({ page = DEFAULT_PAGE, limit = DEFAULT_LIMIT }: PaginationInput) => {
  const safeLimit = Math.min(limit, MAX_LIMIT);
  const safePage = Math.max(page, DEFAULT_PAGE);

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
};

export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

export const parsePaging = (query, defaultLimit = 20) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const pageMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

export const parsePagination = (page?: string, limit?: string) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 20;
  return { page: parsedPage, limit: parsedLimit, skip: (parsedPage - 1) * parsedLimit };
};

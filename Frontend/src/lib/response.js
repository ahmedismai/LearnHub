export const unwrapResponse = (value) =>
  value?.data?.data || value?.data || value || {};

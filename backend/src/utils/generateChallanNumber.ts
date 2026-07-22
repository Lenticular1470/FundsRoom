export const generateChallanNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `CH-${timestamp}`;
};

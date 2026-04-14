export const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? '11111';

export const normalizeUserId = (raw?: string | string[]): string => {
  let userId = Array.isArray(raw) ? raw[0] : raw;

  if (!userId || userId === 'undefined') {
    return DEFAULT_USER_ID;
  }

  const trimmed = userId.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_USER_ID;
};

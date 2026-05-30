const sanitize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildExerciseKey = (name: string, grouping?: string | null): string => {
  const base = sanitize(name ?? 'exercise');
  const group = grouping ? sanitize(grouping) : 'general';
  return `${base}__${group}`;
};

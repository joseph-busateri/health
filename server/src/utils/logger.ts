type LogCategory = 'decision-engine' | 'dashboard' | 'recommendations' | 'baseline';

type LogPayload = {
  category: LogCategory;
  message: string;
  metadata?: Record<string, unknown>;
};

export const logEvent = ({ category, message, metadata }: LogPayload) => {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    category,
    message,
    metadata: metadata ?? {},
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
};

export const logger = {
  error: (message: string, metadata?: Record<string, unknown>) => {
    logEvent({ category: 'baseline', message: `ERROR: ${message}`, metadata });
  },
  info: (message: string, metadata?: Record<string, unknown>) => {
    logEvent({ category: 'baseline', message: `INFO: ${message}`, metadata });
  },
  warn: (message: string, metadata?: Record<string, unknown>) => {
    logEvent({ category: 'baseline', message: `WARN: ${message}`, metadata });
  },
};

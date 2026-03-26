type LogCategory = 'decision-engine' | 'dashboard' | 'recommendations';

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

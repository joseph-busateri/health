import api from './api';

interface UploadBodyCompositionDocumentInput {
  userId: string;
  uri: string;
  fileName?: string;
  mimeType?: string;
}

interface SubmitBodyCompositionScanInput {
  userId: string;
  scanDate: string;
  scanSource: string;
  weightLb: number;
  bodyFatPercentage?: number;
  skeletalMuscleMassLb?: number;
  visceralFatLevel?: number;
  notes?: string;
}

export const uploadBodyCompositionDocument = async (
  input: UploadBodyCompositionDocumentInput,
): Promise<void> => {
  const formData = new FormData();

  formData.append('user_id', input.userId);
  formData.append('file', {
    uri: input.uri,
    name: input.fileName ?? `body-composition-${Date.now()}.jpg`,
    type: input.mimeType ?? 'image/jpeg',
  } as any);

  await api.post('/body-composition/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const submitBodyCompositionScan = async (
  input: SubmitBodyCompositionScanInput,
): Promise<void> => {
  await api.post('/body-composition/scan', {
    userId: input.userId,
    scanDate: input.scanDate,
    scanSource: input.scanSource,
    weightLb: input.weightLb,
    bodyFatPercentage: input.bodyFatPercentage,
    skeletalMuscleMassLb: input.skeletalMuscleMassLb,
    visceralFatLevel: input.visceralFatLevel,
    notes: input.notes,
  });
};

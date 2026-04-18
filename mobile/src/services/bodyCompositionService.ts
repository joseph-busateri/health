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

interface UploadBodyCompositionCSVInput {
  userId: string;
  uri: string;
  fileName: string;
  detectedSource?: 'inbody_s2' | 'inbody_570' | 'inbody_770' | 'dexa' | 'other_scale';
}

interface UploadBodyCompositionCSVResponse {
  success: boolean;
  scanIds: string[];
  message: string;
  errors?: Array<{ row: number; field: string; message: string }>;
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

export const uploadBodyCompositionCSV = async (
  input: UploadBodyCompositionCSVInput,
): Promise<UploadBodyCompositionCSVResponse> => {
  const formData = new FormData();

  formData.append('file', {
    uri: input.uri,
    name: input.fileName,
    type: 'text/csv',
  } as any);

  if (input.detectedSource) {
    formData.append('detected_source', input.detectedSource);
  }

  const response = await api.post<UploadBodyCompositionCSVResponse>(
    `/api/body-composition/${input.userId}/upload-csv`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

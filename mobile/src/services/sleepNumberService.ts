import api from './api';

interface UploadSleepNumberPayload {
  userId: string;
  fileContent: string;
  fileType: 'json' | 'csv';
}

interface UploadSleepNumberResponse {
  sessionCount: number;
  sessionIds: string[];
}

export const uploadSleepNumberData = async (
  payload: UploadSleepNumberPayload,
): Promise<UploadSleepNumberResponse> => {
  const response = await api.post<{ success: boolean; data: UploadSleepNumberResponse }>(
    `/sleep-number/${payload.userId}/upload`,
    {
      fileContent: payload.fileContent,
      fileType: payload.fileType,
    },
  );

  return response.data.data;
};

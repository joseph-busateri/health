import api from './api';
import type {
  PhysiqueScan,
  PhysiqueScanLatestResponse,
  PhysiqueScanListResponse,
} from '../types/physiqueScan';

const USER_ID = process.env.EXPO_PUBLIC_SAMPLE_USER_ID || 'mobile-demo-user';

export const fetchPhysiqueScans = async (): Promise<PhysiqueScanListResponse> => {
  const response = await api.get<PhysiqueScanListResponse>(`/physique-scans/${USER_ID}`);
  return response.data;
};

export const fetchLatestPhysiqueScan = async (): Promise<PhysiqueScan | null> => {
  const response = await api.get<PhysiqueScanLatestResponse>(`/physique-scan/latest/${USER_ID}`);
  return response.data.scan ?? null;
};

export const submitPhysiqueScan = async (payload: {
  frontPhotoUri: string;
  sidePhotoUri: string;
  backPhotoUri: string;
  takenAt?: string;
  notes?: string;
}): Promise<PhysiqueScan> => {
  const response = await api.post<{ scan: PhysiqueScan }>(
    '/physique-scan',
    {
      user_id: USER_ID,
      front_photo_uri: payload.frontPhotoUri,
      side_photo_uri: payload.sidePhotoUri,
      back_photo_uri: payload.backPhotoUri,
      taken_at: payload.takenAt,
      notes: payload.notes,
    },
  );

  return response.data.scan;
};

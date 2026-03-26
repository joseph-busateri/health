export interface PhysiqueScan {
  id: string;
  userId: string;
  takenAt: string;
  frontPhotoUri: string;
  sidePhotoUri: string;
  backPhotoUri: string;
  notes?: string;
  status: 'pending' | 'complete' | 'skipped';
  createdAt: string;
}

export interface PhysiqueScanListResponse {
  scans: PhysiqueScan[];
}

export interface PhysiqueScanLatestResponse {
  scan: PhysiqueScan | null;
}

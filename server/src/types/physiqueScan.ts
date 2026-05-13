export type PhysiqueScanStatus = 'pending' | 'complete' | 'skipped';

export interface PhysiqueScanInput {
  userId: string;
  takenAt?: string;
  frontPhotoUri: string;
  sidePhotoUri: string;
  backPhotoUri: string;
  notes?: string;
}

export interface PhysiqueScanRecord extends PhysiqueScanInput {
  id: string;
  takenAt: string;
  status: PhysiqueScanStatus;
  createdAt: string;
}

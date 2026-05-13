export interface TapeMeasurementInput {
  userId: string;
  takenAt?: string;
  unit?: 'cm' | 'in';
  waist?: number;
  chest?: number;
  hips?: number;
  neck?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftCalf?: number;
  rightCalf?: number;
  notes?: string;
}

export interface TapeMeasurementRecord extends TapeMeasurementInput {
  id: string;
  takenAt: string;
  createdAt: string;
}

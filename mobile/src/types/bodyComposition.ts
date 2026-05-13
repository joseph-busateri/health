export type BodyCompositionSource = 
  | 'inbody_s2' 
  | 'inbody_570' 
  | 'inbody_770' 
  | 'dexa' 
  | 'manual' 
  | 'other_scale';

export type Gender = 'male' | 'female' | 'other';

export interface BodyCompositionScan {
  id: string;
  userId: string;
  
  // Scan metadata
  scanDate: string;
  scanTime?: string;
  scanSource: BodyCompositionSource;
  scanId?: string;
  
  // User demographics at time of scan
  heightInches?: number;
  age?: number;
  gender?: Gender;
  
  // Core measurements (in pounds)
  weightLb: number;
  
  // Body composition breakdown (in pounds)
  totalBodyWaterLb?: number;
  dryLeanMassLb?: number;
  bodyFatMassLb?: number;
  
  // Percentages
  bodyFatPercentage?: number;
  leanBodyMassPercentage?: number;
  bodyWaterPercentage?: number;
  
  // Muscle mass
  skeletalMuscleMassLb?: number;
  skeletalMuscleMassPercentage?: number;
  
  // Fat distribution
  visceralFatLevel?: number;
  visceralFatAreaCm2?: number;
  subcutaneousFatPercentage?: number;
  
  // Bone and protein
  boneMineralContentLb?: number;
  proteinMassLb?: number;
  proteinPercentage?: number;
  
  // Metabolic metrics
  basalMetabolicRateKcal?: number;
  totalEnergyExpenditureKcal?: number;
  
  // Body metrics
  bmi?: number;
  bodyMassIndexCategory?: string;
  metabolicAge?: number;
  bodyType?: string;
  
  // Segmental analysis (arms, legs, trunk) - in pounds
  rightArmMuscleLb?: number;
  leftArmMuscleLb?: number;
  trunkMuscleLb?: number;
  rightLegMuscleLb?: number;
  leftLegMuscleLb?: number;
  
  rightArmFatLb?: number;
  leftArmFatLb?: number;
  trunkFatLb?: number;
  rightLegFatLb?: number;
  leftLegFatLb?: number;
  
  createdAt: string;
}

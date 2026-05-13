// Supplement Baseline Types
// Supports agent-managed supplement stacks with version history

export type SupplementStackCreator = 'user' | 'agent';
export type SupplementStatus = 'active' | 'paused' | 'discontinued';
export type SupplementChangeType = 
  | 'supplement_added' 
  | 'supplement_removed' 
  | 'dosage_changed' 
  | 'timing_changed' 
  | 'frequency_changed' 
  | 'status_changed';
export type InteractionType = 'supplement' | 'medication' | 'food' | 'condition';
export type InteractionSeverity = 'mild' | 'moderate' | 'severe';
export type SupplementDocumentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================================
// SUPPLEMENT STACK VERSION
// ============================================================================

export interface SupplementStackVersion {
  id: string;
  userId: string;
  
  // Version tracking
  versionNumber: number;
  versionName?: string;
  isCurrent: boolean;
  
  // Version metadata
  createdBy: SupplementStackCreator;
  createdReason?: string;
  basedOnRecommendationId?: string;
  
  // Timestamps
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
}

export interface CreateSupplementStackVersionInput {
  userId: string;
  versionName?: string;
  createdBy: SupplementStackCreator;
  createdReason?: string;
  effectiveFrom: string;
}

// ============================================================================
// SUPPLEMENT
// ============================================================================

export interface Supplement {
  id: string;
  stackVersionId: string;
  
  // Supplement details
  supplementName: string;
  brand?: string;
  form?: string; // "capsule", "powder", "liquid", "tablet"
  
  // Dosage information
  dosageAmount: number;
  dosageUnit: string; // "mg", "g", "IU", "mcg", "ml"
  
  // Timing and frequency
  timing: string; // "morning", "evening", "with breakfast", "before bed", "pre-workout", "post-workout"
  frequency: string; // "daily", "twice daily", "3x daily", "as needed", "every other day"
  timesPerDay: number;
  
  // Purpose and reasoning
  goal?: string; // "Recovery", "Performance", "Health", "Sleep", "Cardiovascular"
  reasonToTake?: string;
  
  // Additional details
  takeWithFood: boolean;
  takeWithWater: boolean;
  avoidWith?: string[];
  
  // Cost tracking
  costPerServing?: number;
  servingsPerContainer?: number;
  
  // Status
  status: SupplementStatus;
  discontinueReason?: string;
  
  // Order
  supplementOrder: number;
  
  createdAt: string;
}

export interface CreateSupplementInput {
  stackVersionId: string;
  supplementName: string;
  brand?: string;
  form?: string;
  dosageAmount: number;
  dosageUnit: string;
  timing: string;
  frequency: string;
  timesPerDay?: number;
  goal?: string;
  reasonToTake?: string;
  takeWithFood?: boolean;
  takeWithWater?: boolean;
  avoidWith?: string[];
  costPerServing?: number;
  servingsPerContainer?: number;
  supplementOrder: number;
}

// ============================================================================
// SUPPLEMENT ADHERENCE LOG
// ============================================================================

export interface SupplementAdherenceLog {
  id: string;
  userId: string;
  supplementId: string;
  stackVersionId?: string;
  
  // Adherence details
  scheduledDate: string;
  scheduledTime: string;
  
  // Actual intake
  taken: boolean;
  takenAt?: string;
  
  // Dosage tracking
  plannedDosageAmount: number;
  actualDosageAmount?: number;
  dosageUnit: string;
  
  // Missed dose tracking
  missed: boolean;
  missReason?: string;
  
  // Side effects
  sideEffectsReported: boolean;
  sideEffectsDescription?: string;
  sideEffectsSeverity?: number; // 1-5
  
  // Effectiveness
  perceivedEffectiveness?: number; // 1-5
  
  // Notes
  notes?: string;
  
  createdAt: string;
}

export interface CreateSupplementAdherenceLogInput {
  userId: string;
  supplementId: string;
  stackVersionId?: string;
  scheduledDate: string;
  scheduledTime: string;
  taken: boolean;
  takenAt?: string;
  plannedDosageAmount: number;
  actualDosageAmount?: number;
  dosageUnit: string;
  missed?: boolean;
  missReason?: string;
  sideEffectsReported?: boolean;
  sideEffectsDescription?: string;
  sideEffectsSeverity?: number;
  perceivedEffectiveness?: number;
  notes?: string;
}

// ============================================================================
// SUPPLEMENT STACK CHANGES
// ============================================================================

export interface SupplementStackChange {
  id: string;
  fromVersionId?: string;
  toVersionId: string;
  
  // Change details
  changeType: SupplementChangeType;
  changeDescription: string;
  
  // What changed
  supplementName?: string;
  oldValue?: string;
  newValue?: string;
  
  // Why it changed
  reason?: string;
  
  // Supporting data
  triggeredByBloodwork: boolean;
  triggeredBySideEffects: boolean;
  triggeredByAdherence: boolean;
  triggeredByPerformance: boolean;
  
  createdAt: string;
}

export interface CreateSupplementStackChangeInput {
  fromVersionId?: string;
  toVersionId: string;
  changeType: SupplementChangeType;
  changeDescription: string;
  supplementName?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  triggeredByBloodwork?: boolean;
  triggeredBySideEffects?: boolean;
  triggeredByAdherence?: boolean;
  triggeredByPerformance?: boolean;
}

// ============================================================================
// SUPPLEMENT BASELINE DOCUMENT
// ============================================================================

export interface SupplementBaselineDocument {
  id: string;
  userId: string;
  stackVersionId?: string;
  
  // Document info
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  
  // Processing status
  processingStatus: SupplementDocumentProcessingStatus;
  processingError?: string;
  
  // Extracted data
  extractedText?: string;
  parsedSupplementData?: ParsedSupplementData;
  
  uploadedAt: string;
  processedAt?: string;
}

// ============================================================================
// PARSED SUPPLEMENT DATA (from Excel/document)
// ============================================================================

export interface ParsedSupplementData {
  supplements: ParsedSupplement[];
  metadata?: {
    uploadSource?: string;
    totalSupplements?: number;
  };
}

export interface ParsedSupplement {
  supplementName: string;
  brand?: string;
  dosageAmount: number;
  dosageUnit: string;
  timing: string;
  frequency?: string;
  goal?: string;
  reasonToTake?: string;
  order: number;
}

// ============================================================================
// SUPPLEMENT INTERACTIONS
// ============================================================================

export interface SupplementInteraction {
  id: string;
  supplementName: string;
  interactsWith: string;
  interactionType: InteractionType;
  severity: InteractionSeverity;
  interactionDescription: string;
  recommendation?: string;
  source?: string;
  createdAt: string;
}

export interface CreateSupplementInteractionInput {
  supplementName: string;
  interactsWith: string;
  interactionType: InteractionType;
  severity: InteractionSeverity;
  interactionDescription: string;
  recommendation?: string;
  source?: string;
}

// ============================================================================
// SUPPLEMENT INVENTORY
// ============================================================================

export interface SupplementInventory {
  id: string;
  userId: string;
  supplementId?: string;
  
  // Inventory details
  supplementName: string;
  brand?: string;
  
  // Quantity
  currentServings: number;
  servingsPerContainer?: number;
  
  // Reorder tracking
  reorderThreshold: number;
  needsReorder: boolean;
  
  // Purchase info
  lastPurchaseDate?: string;
  lastPurchaseCost?: number;
  vendor?: string;
  
  // Expiration
  expirationDate?: string;
  
  updatedAt: string;
}

export interface CreateSupplementInventoryInput {
  userId: string;
  supplementId?: string;
  supplementName: string;
  brand?: string;
  currentServings: number;
  servingsPerContainer?: number;
  reorderThreshold?: number;
  lastPurchaseDate?: string;
  lastPurchaseCost?: number;
  vendor?: string;
  expirationDate?: string;
}

// ============================================================================
// COMPLETE SUPPLEMENT STACK (for API responses)
// ============================================================================

export interface CompleteSupplementStack {
  version: SupplementStackVersion;
  supplements: Supplement[];
  changes?: SupplementStackChange[];
  interactions?: SupplementInteraction[];
}

// ============================================================================
// ADHERENCE SUMMARY
// ============================================================================

export interface SupplementAdherenceSummary {
  supplementId: string;
  supplementName: string;
  stackVersionId: string;
  userId: string;
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  adherencePercentage: number;
  sideEffectsCount: number;
  avgEffectiveness?: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface UploadSupplementBaselineRequest {
  userId: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
}

export interface GetCurrentSupplementStackResponse {
  success: boolean;
  data?: CompleteSupplementStack;
  error?: string;
}

export interface GetSupplementHistoryResponse {
  success: boolean;
  data?: {
    versions: SupplementStackVersion[];
    currentVersion?: CompleteSupplementStack;
  };
  error?: string;
}

export interface LogSupplementAdherenceRequest {
  userId: string;
  supplementId: string;
  scheduledDate: string;
  scheduledTime: string;
  taken: boolean;
  takenAt?: string;
  plannedDosageAmount: number;
  actualDosageAmount?: number;
  dosageUnit: string;
  missed?: boolean;
  missReason?: string;
  sideEffectsReported?: boolean;
  sideEffectsDescription?: string;
  sideEffectsSeverity?: number;
  perceivedEffectiveness?: number;
  notes?: string;
}

export interface UpdateSupplementStackRequest {
  userId: string;
  createdBy: SupplementStackCreator;
  createdReason: string;
  changes: SupplementStackUpdateChange[];
}

export interface SupplementStackUpdateChange {
  supplementName: string;
  changeType: SupplementChangeType;
  newValue?: any;
  reason?: string;
  triggeredByBloodwork?: boolean;
  triggeredBySideEffects?: boolean;
  triggeredByAdherence?: boolean;
  triggeredByPerformance?: boolean;
}

export interface CheckInteractionsRequest {
  supplementNames: string[];
}

export interface CheckInteractionsResponse {
  success: boolean;
  data?: {
    interactions: SupplementInteraction[];
    hasInteractions: boolean;
    severeInteractions: number;
    moderateInteractions: number;
    mildInteractions: number;
  };
  error?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface SupplementAdherenceMetrics {
  userId: string;
  period: string; // "7days", "30days", "90days"
  overallAdherence: number;
  supplementBreakdown: {
    supplementName: string;
    adherenceRate: number;
    missedDoses: number;
    sideEffects: number;
  }[];
  commonMissReasons: {
    reason: string;
    count: number;
  }[];
}

export interface SupplementReorderAlert {
  supplementId: string;
  supplementName: string;
  brand?: string;
  currentServings: number;
  daysRemaining: number;
  reorderUrl?: string;
  estimatedCost?: number;
}

export interface SupplementEffectivenessReport {
  supplementName: string;
  avgEffectiveness: number;
  totalRatings: number;
  correlatedMetrics?: {
    metric: string;
    correlation: number;
  }[];
}

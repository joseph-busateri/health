export interface BaselineConfig {
  userId: string;
  defaultSleepTarget: number; // hours
  stressTolerance: number; // 1-5 scale
  recoverySensitivity: number; // 0-1 multiplier
}

export interface BaselineConfigResponse {
  config: BaselineConfig;
}

export interface BaselineConfig {
  userId: string;
  defaultSleepTarget: number;
  stressTolerance: number;
  recoverySensitivity: number;
}

export interface BaselineConfigResponse {
  config: BaselineConfig;
}

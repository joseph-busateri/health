import type { ControlTowerSummary, HealthComponentKey } from './dailyLog';

export interface VerbalPromptContext {
  controlTower: ControlTowerSummary;
}

export interface VerbalPromptSelection {
  primaryPrompt: string;
  followUpPrompt?: string;
  reason: string;
  focusComponents: HealthComponentKey[];
}

import { selectVerbalPrompt } from '../services/verbalPromptService';
import type { ControlTowerSummary, HealthComponentKey, HealthComponentScore } from '../types/dailyLog';

const makeComponent = (overrides: Partial<HealthComponentScore>): HealthComponentScore => {
  return {
    key: 'rec',
    label: 'Recovery',
    score: 80,
    status: 'Optimal',
    trend: 'Stable',
    ...overrides,
  } as HealthComponentScore;
};

const buildSummary = (
  overrides: Partial<ControlTowerSummary>,
  componentOverrides: Partial<Record<HealthComponentKey, Partial<HealthComponentScore>>>,
): ControlTowerSummary => {
  const defaultSummary: ControlTowerSummary = {
    overallScore: 85,
    overallStatus: 'Optimal',
    overallTrend: 'Stable',
    recommendationSummary: 'Stay the course.',
    components: {
      rec: makeComponent({ key: 'rec', label: 'Recovery' }),
      perf: makeComponent({ key: 'perf', label: 'Performance' }),
      met: makeComponent({ key: 'met', label: 'Metabolic' }),
      cv: makeComponent({ key: 'cv', label: 'Cardiovascular' }),
      sh: makeComponent({ key: 'sh', label: 'Sexual Health' }),
    },
    ...overrides,
  };

  Object.entries(componentOverrides).forEach(([key, override]) => {
    const typedKey = key as HealthComponentKey;
    defaultSummary.components[typedKey] = {
      ...defaultSummary.components[typedKey],
      ...override,
    };
  });

  return defaultSummary;
};

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const scenarioDefault = () => {
  const summary = buildSummary({}, {});
  const result = selectVerbalPrompt({ controlTower: summary });

  assert(result.focusComponents.length === 0, 'Default scenario expected zero focus components');
  assert(/steady/.test(result.primaryPrompt), 'Default scenario primary prompt should mention steadiness');
  assert(/No components flagged/.test(result.reason), 'Default scenario reason should mention no flags');
};

const scenarioRecovery = () => {
  const summary = buildSummary({}, { rec: { status: 'At Risk', score: 45, trend: 'Declining' } });
  const result = selectVerbalPrompt({ controlTower: summary });

  assert(result.focusComponents.length === 1 && result.focusComponents[0] === 'rec', 'Recovery scenario should focus on rec');
  assert(/Recovery is down/.test(result.primaryPrompt), 'Recovery scenario prompt should mention recovery down');
  assert(/Recovery score 45/.test(result.reason), 'Recovery scenario should cite score 45');
};

const scenarioFollowUp = () => {
  const summary = buildSummary({}, {
    rec: { status: 'At Risk', score: 45, trend: 'Declining' },
    perf: { status: 'Stable', score: 65, trend: 'Declining', label: 'Performance' },
  });

  const result = selectVerbalPrompt({ controlTower: summary });

  assert(result.focusComponents.length === 2 && result.focusComponents.includes('perf'), 'Follow-up scenario should include perf focus');
  assert(Boolean(result.followUpPrompt), 'Follow-up scenario should provide a follow-up prompt');
  assert(/Performance/.test(result.reason), 'Follow-up scenario reason should reference performance');
};

const scenarioMetabolic = () => {
  const summary = buildSummary({}, {
    rec: { status: 'Optimal', score: 85 },
    perf: { status: 'Stable', score: 70 },
    met: { status: 'At Risk', score: 50, trend: 'Declining', label: 'Metabolic' },
  });

  const result = selectVerbalPrompt({ controlTower: summary });

  assert(result.focusComponents[0] === 'met', 'Metabolic scenario should focus on met');
  assert(/Nutrition consistency/.test(result.primaryPrompt), 'Metabolic scenario prompt should mention nutrition consistency');
  assert(/Metabolic score 50/.test(result.reason), 'Metabolic scenario reason should cite score 50');
};

const run = () => {
  const scenarios = [
    { name: 'default stable scenario', fn: scenarioDefault },
    { name: 'recovery at risk scenario', fn: scenarioRecovery },
    { name: 'follow-up secondary focus scenario', fn: scenarioFollowUp },
    { name: 'metabolic priority scenario', fn: scenarioMetabolic },
  ];

  scenarios.forEach((scenario) => {
    try {
      scenario.fn();
      console.log(`✅ ${scenario.name}`);
    } catch (error) {
      console.error(`❌ ${scenario.name}:`, error);
      process.exitCode = 1;
    }
  });
};

run();

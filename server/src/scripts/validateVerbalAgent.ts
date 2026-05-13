import { selectVerbalPrompt } from '../services/verbalPromptService';
import type { ControlTowerSummary, HealthComponentKey, HealthComponentScore } from '../types/dailyLog';

const makeComponent = (overrides: Partial<HealthComponentScore>): HealthComponentScore => {
  return {
    key: 'rec',
    label: 'Recovery',
    score: 85,
    status: 'Optimal',
    trend: 'Stable',
    ...overrides,
  } as HealthComponentScore;
};

const buildSummary = (
  componentOverrides: Partial<Record<HealthComponentKey, Partial<HealthComponentScore>>>,
  overrides?: Partial<ControlTowerSummary>,
): ControlTowerSummary => {
  const baseSummary: ControlTowerSummary = {
    overallScore: overrides?.overallScore ?? 82,
    overallStatus: overrides?.overallStatus ?? 'Optimal',
    overallTrend: overrides?.overallTrend ?? 'Stable',
    recommendationSummary: overrides?.recommendationSummary ?? 'Momentum is steady.',
    components: {
      rec: makeComponent({ key: 'rec', label: 'Recovery' }),
      perf: makeComponent({ key: 'perf', label: 'Performance' }),
      met: makeComponent({ key: 'met', label: 'Metabolic' }),
      cv: makeComponent({ key: 'cv', label: 'Cardiovascular' }),
      sh: makeComponent({ key: 'sh', label: 'Sexual Health' }),
    },
  };

  Object.entries(componentOverrides).forEach(([key, override]) => {
    const typedKey = key as HealthComponentKey;
    baseSummary.components[typedKey] = {
      ...baseSummary.components[typedKey],
      ...override,
    };
  });

  return baseSummary;
};

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

interface Scenario {
  name: string;
  summary: ControlTowerSummary;
  expectations: {
    focusComponents: HealthComponentKey[];
    primaryPattern: RegExp;
    reasonPattern: RegExp;
    followUpExpected?: boolean;
  };
}

const MAX_PROMPT_LENGTH = 180;

const scenarios: Scenario[] = [
  {
    name: 'Scenario 1: Low Recovery',
    summary: buildSummary({
      rec: { score: 45, status: 'At Risk', trend: 'Declining' },
      perf: { score: 78, status: 'Stable', trend: 'Stable' },
      met: { score: 72, status: 'Stable', trend: 'Stable' },
    }, {
      overallScore: 58,
      overallStatus: 'At Risk',
      overallTrend: 'Declining',
      recommendationSummary: 'Prioritize recovery reset.',
    }),
    expectations: {
      focusComponents: ['rec'],
      primaryPattern: /Recovery is down/, 
      reasonPattern: /Recovery score 45/,
      followUpExpected: false,
    },
  },
  {
    name: 'Scenario 2: Low Performance',
    summary: buildSummary({
      perf: { score: 48, status: 'At Risk', trend: 'Declining' },
      rec: { score: 82, status: 'Optimal', trend: 'Stable' },
      met: { score: 75, status: 'Stable', trend: 'Stable' },
    }, {
      overallScore: 64,
      overallStatus: 'Stable',
      overallTrend: 'Declining',
      recommendationSummary: 'Rebuild training cadence.',
    }),
    expectations: {
      focusComponents: ['perf'],
      primaryPattern: /Workout adherence dropped/, 
      reasonPattern: /Performance score 48/,
      followUpExpected: false,
    },
  },
  {
    name: 'Scenario 3: Low Metabolic',
    summary: buildSummary({
      met: { score: 50, status: 'At Risk', trend: 'Declining' },
      rec: { score: 84, status: 'Optimal', trend: 'Stable' },
      perf: { score: 76, status: 'Stable', trend: 'Stable' },
    }, {
      overallScore: 62,
      overallStatus: 'Stable',
      overallTrend: 'Declining',
      recommendationSummary: 'Dial nutrition back in.',
    }),
    expectations: {
      focusComponents: ['met'],
      primaryPattern: /Nutrition consistency is off/, 
      reasonPattern: /Metabolic score 50/,
      followUpExpected: false,
    },
  },
  {
    name: 'Scenario 4: Mixed Low Components',
    summary: buildSummary({
      rec: { score: 46, status: 'At Risk', trend: 'Declining' },
      perf: { score: 55, status: 'At Risk', trend: 'Declining' },
      met: { score: 68, status: 'Stable', trend: 'Declining' },
    }, {
      overallScore: 57,
      overallStatus: 'At Risk',
      overallTrend: 'Declining',
      recommendationSummary: 'Stabilize recovery and training.',
    }),
    expectations: {
      focusComponents: ['rec', 'perf'],
      primaryPattern: /Recovery is down/, 
      reasonPattern: /Secondary focus: Performance/,
      followUpExpected: true,
    },
  },
  {
    name: 'Scenario 5: High Optimal Day',
    summary: buildSummary({
      rec: { score: 90, status: 'Optimal', trend: 'Improving' },
      perf: { score: 92, status: 'Optimal', trend: 'Improving' },
      met: { score: 88, status: 'Optimal', trend: 'Stable' },
      cv: { score: 85, status: 'Optimal', trend: 'Stable' },
      sh: { score: 82, status: 'Optimal', trend: 'Stable' },
    }, {
      overallScore: 90,
      overallStatus: 'Optimal',
      overallTrend: 'Improving',
      recommendationSummary: 'Keep it rolling.',
    }),
    expectations: {
      focusComponents: [],
      primaryPattern: /everything looks steady/i,
      reasonPattern: /No components flagged/i,
      followUpExpected: false,
    },
  },
];

interface ScenarioResult {
  name: string;
  passed: boolean;
  details: string[];
}

const runScenario = ({ name, summary, expectations }: Scenario): ScenarioResult => {
  const result = selectVerbalPrompt({ controlTower: summary });
  const details: string[] = [];
  const failures: string[] = [];

  try {
    const { focusComponents, primaryPattern, reasonPattern, followUpExpected } = expectations;

    const promptLength = result.primaryPrompt.length + (result.followUpPrompt?.length ?? 0);
    assert(promptLength <= MAX_PROMPT_LENGTH, `Prompts too long (${promptLength} chars)`);

    assert(
      focusComponents.length === result.focusComponents.length && focusComponents.every((value, index) => result.focusComponents[index] === value),
      `Expected focus components ${focusComponents.join(', ')} but got ${result.focusComponents.join(', ')}`,
    );

    assert(primaryPattern.test(result.primaryPrompt), `Primary prompt mismatch: ${result.primaryPrompt}`);
    assert(reasonPattern.test(result.reason), `Reason mismatch: ${result.reason}`);

    if (followUpExpected) {
      assert(Boolean(result.followUpPrompt), 'Expected follow-up prompt but none returned');
    } else {
      assert(!result.followUpPrompt, 'Unexpected follow-up prompt returned');
    }

    details.push(`Focus: ${result.focusComponents.join(', ') || 'None'}`);
    details.push(`Primary: ${result.primaryPrompt}`);
    if (result.followUpPrompt) {
      details.push(`Follow-up: ${result.followUpPrompt}`);
    }
    details.push(`Reason: ${result.reason}`);
    details.push('Scenario result: PASS');

    return { name, passed: true, details };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(message);

    details.push(`Focus: ${result.focusComponents.join(', ') || 'None'}`);
    details.push(`Primary: ${result.primaryPrompt}`);
    if (result.followUpPrompt) {
      details.push(`Follow-up: ${result.followUpPrompt}`);
    }
    details.push(`Reason: ${result.reason}`);
    details.push(`Scenario result: FAIL -> ${failures.join('; ')}`);

    return { name, passed: false, details };
  }
};

const outcomes = scenarios.map(runScenario);

outcomes.forEach((outcome) => {
  console.log(`\n=== ${outcome.name} ===`);
  outcome.details.forEach((line) => console.log(line));
});

const passCount = outcomes.filter((outcome) => outcome.passed).length;
console.log('\n==========================================');
console.log(`Validation summary: ${passCount}/${outcomes.length} scenarios passed.`);
console.log(`Overall result: ${passCount === outcomes.length ? '✅ PASS' : '❌ FAIL'}`);
console.log('==========================================');

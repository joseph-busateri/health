import type {
  ControlTowerSummary,
  HealthComponentKey,
  HealthComponentScore,
} from '../types/dailyLog';
import type { VerbalPromptContext, VerbalPromptSelection } from '../types/verbalAgent';

type PrimaryPromptResult = {
  prompt: string;
  reason: string;
};

type ComponentPromptBuilder = {
  buildPrimary: (component: HealthComponentScore, summary: ControlTowerSummary) => PrimaryPromptResult;
  buildFollowUp?: (component: HealthComponentScore, summary: ControlTowerSummary) => string;
};

const COMPONENT_PRIORITY: HealthComponentKey[] = ['rec', 'perf', 'met', 'cv', 'sh'];

const describeComponentState = (component: HealthComponentScore): string => {
  const parts: string[] = [component.label];

  if (component.score !== null) {
    parts.push(`score ${component.score}`);
  }

  parts.push(`status ${component.status}`);

  if (component.trend !== 'Stable') {
    parts.push(`trend ${component.trend}`);
  }

  return parts.join(', ');
};

const buildRecoveryPrimary = (component: HealthComponentScore): PrimaryPromptResult => {
  const declining = component.trend === 'Declining';
  const prompt = component.status === 'At Risk'
    ? 'Recovery is down today—do you feel fatigued or just short on sleep?'
    : 'Recovery trend dipped—did stress spike or has sleep been choppy?';

  const trendDescriptor = declining ? ' with a declining trend' : '';
  const reason = `${component.label} score ${component.score ?? '—'} is ${component.status}${trendDescriptor}.`;

  return { prompt, reason };
};

const buildPerformancePrimary = (component: HealthComponentScore): PrimaryPromptResult => {
  const declining = component.trend === 'Declining';
  const prompt = component.status === 'At Risk'
    ? 'Workout adherence dropped—was that recovery, schedule, or motivation?'
    : 'Training momentum is sliding—was that planned or did something unexpected pop up?';

  const trendDescriptor = declining ? ' and the trend is declining' : '';
  const reason = `${component.label} score ${component.score ?? '—'} is ${component.status}${trendDescriptor}.`;

  return { prompt, reason };
};

const buildMetabolicPrimary = (component: HealthComponentScore): PrimaryPromptResult => {
  const declining = component.trend === 'Declining';
  const prompt = component.status === 'At Risk'
    ? 'Nutrition consistency is off—low appetite, heavy meals, or missed logging?'
    : 'Metabolic consistency slipped—are meals irregular or has tracking lagged?';

  const trendDescriptor = declining ? ' with declining consistency' : '';
  const reason = `${component.label} score ${component.score ?? '—'} is ${component.status}${trendDescriptor}.`;

  return { prompt, reason };
};

const buildCardioPrimary = (component: HealthComponentScore): PrimaryPromptResult => {
  const noData = component.score === null;
  const prompt = noData
    ? 'Cardio metrics are still booting up—any heart rate or blood pressure notes to add?'
    : component.status === 'At Risk'
      ? 'Cardio readiness looks soft—did stress stay elevated or was conditioning skipped?'
      : 'Cardio trend dipped—any heavy stress, stimulants, or missed conditioning sessions?';

  const reason = noData
    ? `${component.label} has no direct data yet; keeping awareness high.`
    : `${component.label} score ${component.score} is ${component.status}${component.trend === 'Declining' ? ' with a declining trend' : ''}.`;

  return { prompt, reason };
};

const buildSexualHealthPrimary = (component: HealthComponentScore): PrimaryPromptResult => {
  const noData = component.score === null;
  const prompt = noData
    ? 'Sexual health check-ins are still pending—any quick update you want to note?'
    : component.status === 'At Risk'
      ? 'Sexual health reminders are overdue—mind sharing what got in the way?'
      : 'Sexual health cadence slipped—was it schedule, mindset, or something else?';

  const reason = noData
    ? `${component.label} insights rely on reminders; prompting for context while data builds.`
    : `${component.label} score ${component.score} is ${component.status}${component.trend === 'Declining' ? ' with a declining trend' : ''}.`;

  return { prompt, reason };
};

const COMPONENT_PROMPTS: Record<HealthComponentKey, ComponentPromptBuilder> = {
  rec: {
    buildPrimary: (component) => buildRecoveryPrimary(component),
    buildFollowUp: () => 'Anything you can adjust tonight to reset recovery—earlier wind-down, lighter load, or stress relief?',
  },
  perf: {
    buildPrimary: (component) => buildPerformancePrimary(component),
    buildFollowUp: () => 'Should we dial training intensity, reschedule sessions, or get an accountability nudge?',
  },
  met: {
    buildPrimary: (component) => buildMetabolicPrimary(component),
    buildFollowUp: () => 'Would prepping meals, setting logging reminders, or adjusting macros help today?',
  },
  cv: {
    buildPrimary: (component) => buildCardioPrimary(component),
    buildFollowUp: () => 'Any cardio plans you want to recommit to—walk, zone 2, or breathwork?',
  },
  sh: {
    buildPrimary: (component) => buildSexualHealthPrimary(component),
    buildFollowUp: () => 'Want a quick reminder to capture sexual health notes this week?',
  },
};

const getSeverity = (key: HealthComponentKey, component: HealthComponentScore): number => {
  if ((key === 'cv' || key === 'sh') && component.score === null) {
    return 0;
  }

  if (component.status === 'At Risk') {
    return 3;
  }

  if (component.trend === 'Declining') {
    return 2;
  }

  return 0;
};

const selectDefaultPrompt = (summary: ControlTowerSummary): VerbalPromptSelection => {
  const primaryPrompt = 'Everything looks steady today—anything specific you want to double down on or celebrate?';
  const reason = `No components flagged as At Risk or Declining. Overall status is ${summary.overallStatus}.`;

  return {
    primaryPrompt,
    reason,
    focusComponents: [],
  };
};

export const selectVerbalPrompt = (context: VerbalPromptContext): VerbalPromptSelection => {
  const { controlTower } = context;
  const candidates = COMPONENT_PRIORITY.map((key) => {
    const component = controlTower.components[key];
    return {
      key,
      component,
      severity: getSeverity(key, component),
    };
  }).filter((candidate) => candidate.component !== undefined);

  const primaryCandidate = candidates.find((candidate) => candidate.severity > 0);

  if (!primaryCandidate) {
    return selectDefaultPrompt(controlTower);
  }

  const builder = COMPONENT_PROMPTS[primaryCandidate.key];
  const primaryResult = builder.buildPrimary(primaryCandidate.component, controlTower);

  const followCandidate = candidates.find(
    (candidate) => candidate.key !== primaryCandidate.key && candidate.severity >= 2,
  );

  const focusComponents: HealthComponentKey[] = [primaryCandidate.key];
  let followUpPrompt: string | undefined;
  let reason = primaryResult.reason;

  if (followCandidate) {
    const followBuilder = COMPONENT_PROMPTS[followCandidate.key];
    const followUp = followBuilder.buildFollowUp?.(followCandidate.component, controlTower);

    if (followUp) {
      followUpPrompt = followUp;
    }

    focusComponents.push(followCandidate.key);
    reason = `${reason} Secondary focus: ${describeComponentState(followCandidate.component)}.`;
  }

  return {
    primaryPrompt: primaryResult.prompt,
    followUpPrompt,
    reason,
    focusComponents,
  };
};

import type {
  CrossEngineInputs,
  CrossEngineSignal,
  CrossEngineEvidence,
  CrossEngineOverallStatus,
} from '../types/crossEngine';

export function buildCrossEngineEvidence(inputs: CrossEngineInputs): CrossEngineEvidence {
  const signals: CrossEngineSignal[] = [];

  // Recovery signal
  if (inputs.recoveryScore !== undefined) {
    const recoveryScore = inputs.recoveryScore;
    let interpretation = '';
    
    if (recoveryScore >= 70) {
      interpretation = 'Recovery is strong, supporting resilience to stress and training load.';
    } else if (recoveryScore >= 50) {
      interpretation = 'Recovery is moderate, requiring careful load management.';
    } else {
      interpretation = 'Recovery is suppressed which reduces resilience to stress and joint loading.';
    }

    signals.push({
      name: 'recoveryScore',
      value: recoveryScore,
      interpretation,
    });
  }

  if (inputs.recoveryStatus) {
    signals.push({
      name: 'recoveryStatus',
      value: inputs.recoveryStatus,
      interpretation: `Recovery status: ${inputs.recoveryStatus}`,
    });
  }

  // Stress signal
  if (inputs.stressScore !== undefined) {
    const stressScore = inputs.stressScore;
    let interpretation = '';
    
    if (stressScore >= 70) {
      interpretation = 'Stress is elevated which increases CNS fatigue and reduces recovery capacity.';
    } else if (stressScore >= 40) {
      interpretation = 'Stress is moderate, requiring monitoring and management.';
    } else {
      interpretation = 'Stress is low, supporting optimal training adaptation.';
    }

    signals.push({
      name: 'stressScore',
      value: stressScore,
      interpretation,
    });
  }

  if (inputs.stressStatus) {
    signals.push({
      name: 'stressStatus',
      value: inputs.stressStatus,
      interpretation: `Stress status: ${inputs.stressStatus}`,
    });
  }

  // Joint signal
  if (inputs.jointRiskLevel) {
    let interpretation = '';
    
    if (inputs.jointRiskLevel === 'high') {
      interpretation = 'Joint discomfort detected which may require movement modification and load reduction.';
    } else if (inputs.jointRiskLevel === 'moderate') {
      interpretation = 'Joint caution indicated, requiring exercise modifications.';
    } else {
      interpretation = 'Joint health is stable, supporting normal training.';
    }

    signals.push({
      name: 'jointRiskLevel',
      value: inputs.jointRiskLevel,
      interpretation,
    });
  }

  if (inputs.jointStatus) {
    signals.push({
      name: 'jointStatus',
      value: inputs.jointStatus,
      interpretation: `Joint status: ${inputs.jointStatus}`,
    });
  }

  // Determine overall status
  const overallStatus = determineOverallStatus(inputs);

  // Generate summary
  const summary = generateSummary(overallStatus, inputs);

  return {
    overallStatus,
    signals,
    summary,
    sourceInputs: inputs,
  };
}

function determineOverallStatus(inputs: CrossEngineInputs): CrossEngineOverallStatus {
  const recoveryScore = inputs.recoveryScore ?? 70;
  const stressScore = inputs.stressScore ?? 30;
  const jointRisk = inputs.jointRiskLevel ?? 'low';

  // High risk conditions
  if (
    (stressScore >= 70 && recoveryScore < 50) ||
    (jointRisk === 'high' && recoveryScore < 50) ||
    (stressScore >= 70 && jointRisk === 'high')
  ) {
    return 'high_risk';
  }

  // Constrained conditions
  if (
    (stressScore >= 70 || recoveryScore < 50 || jointRisk === 'high') ||
    (stressScore >= 40 && recoveryScore < 70 && jointRisk === 'moderate')
  ) {
    return 'constrained';
  }

  // Moderate conditions
  if (
    (stressScore >= 40 && stressScore < 70) ||
    (recoveryScore >= 50 && recoveryScore < 70) ||
    jointRisk === 'moderate'
  ) {
    return 'moderate';
  }

  // Optimal
  return 'optimal';
}

function generateSummary(status: CrossEngineOverallStatus, inputs: CrossEngineInputs): string {
  const issues: string[] = [];

  if (inputs.recoveryScore !== undefined && inputs.recoveryScore < 50) {
    issues.push('low recovery');
  }
  if (inputs.stressScore !== undefined && inputs.stressScore >= 70) {
    issues.push('high stress');
  }
  if (inputs.jointRiskLevel === 'high') {
    issues.push('joint risk');
  }

  if (status === 'high_risk') {
    return `Multiple systems indicate elevated load requiring immediate caution: ${issues.join(', ')}.`;
  } else if (status === 'constrained') {
    return `System constraints detected requiring training modifications: ${issues.join(', ')}.`;
  } else if (status === 'moderate') {
    return 'Systems show moderate load requiring monitoring and management.';
  } else {
    return 'All systems indicate readiness for training.';
  }
}

import { Router } from 'express';

const router = Router();

interface HealthData {
  id: string;
  title: string;
  description: string;
  value: number;
  unit: string;
}

interface HealthDetail extends HealthData {
  history: Array<{
    date: string;
    value: number;
  }>;
  recommendations: string[];
}

const mockHealthData: HealthData[] = [
  {
    id: '1',
    title: 'Heart Rate',
    description: 'Average resting heart rate',
    value: 72,
    unit: 'bpm'
  },
  {
    id: '2',
    title: 'Blood Pressure',
    description: 'Systolic/Diastolic pressure',
    value: 120,
    unit: 'mmHg'
  },
  {
    id: '3',
    title: 'Steps Today',
    description: 'Daily step count',
    value: 8432,
    unit: 'steps'
  },
  {
    id: '4',
    title: 'Sleep Quality',
    description: 'Average sleep score',
    value: 85,
    unit: '%'
  }
];

const getHealthDetail = (id: string): HealthDetail | null => {
  const baseData = mockHealthData.find(item => item.id === id);
  if (!baseData) return null;

  return {
    ...baseData,
    history: [
      { date: '2024-03-22', value: baseData.value - 2 },
      { date: '2024-03-21', value: baseData.value + 1 },
      { date: '2024-03-20', value: baseData.value },
      { date: '2024-03-19', value: baseData.value - 1 },
      { date: '2024-03-18', value: baseData.value + 3 }
    ],
    recommendations: getRecommendations(baseData.id)
  };
};

const getRecommendations = (id: string): string[] => {
  const recommendations: { [key: string]: string[] } = {
    '1': [
      'Maintain regular cardiovascular exercise',
      'Practice stress management techniques',
      'Stay hydrated throughout the day'
    ],
    '2': [
      'Reduce sodium intake',
      'Maintain healthy weight',
      'Limit alcohol consumption'
    ],
    '3': [
      'Take a walk during lunch break',
      'Use stairs instead of elevator',
      'Set hourly movement reminders'
    ],
    '4': [
      'Maintain consistent sleep schedule',
      'Avoid screens before bedtime',
      'Create a relaxing bedtime routine'
    ]
  };
  
  return recommendations[id] || ['Continue monitoring your health metrics'];
};

router.get('/', (req, res) => {
  res.json(mockHealthData);
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const healthDetail = getHealthDetail(id);
  
  if (!healthDetail) {
    return res.status(404).json({ error: 'Health data not found' });
  }
  
  res.json(healthDetail);
});

export default router;

export interface ForecastDataset {
  id: string;
  name: string;
  recordsCount: number;
  accuracyRate: number;
  lastTrained: string;
}

export interface PredictiveMetric {
  id: string;
  metricName: string;
  currentValue: number;
  projectedValue: number;
  confidenceScore: number;
}

export interface ModelTrainingJob {
  id: string;
  modelName: string;
  algorithm: string;
  progress: number;
  status: 'Queued' | 'Training' | 'Completed' | 'Failed';
}

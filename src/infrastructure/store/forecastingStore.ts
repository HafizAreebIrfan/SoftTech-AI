import { create } from "zustand";
import { ForecastDataset, PredictiveMetric, ModelTrainingJob } from "../../types/forecasting";

interface ForecastingState {
  perspective: 'subscriber' | 'provider';
  datasets: ForecastDataset[];
  metrics: PredictiveMetric[];
  trainingJobs: ModelTrainingJob[];
  trainModalOpen: boolean;

  setPerspective: (val: 'subscriber' | 'provider') => void;
  openTrainModal: () => void;
  closeTrainModal: () => void;

  triggerModelTraining: (modelName: string, algorithm: string) => void;
  updateJobProgress: (id: string, progress: number) => void;
  resetStore: () => void;
}

const INITIAL_DATASETS: ForecastDataset[] = [
  { id: "ds_1", name: "Q3 Customer Churn Predictive Matrix", recordsCount: 148000, accuracyRate: 94.2, lastTrained: "2026-07-18" },
  { id: "ds_2", name: "Regional Demand Volatility Index", recordsCount: 650000, accuracyRate: 91.8, lastTrained: "2026-07-15" },
  { id: "ds_3", name: "Supply Chain Lead-Time Estimator", recordsCount: 89000, accuracyRate: 96.5, lastTrained: "2026-07-12" }
];

const INITIAL_METRICS: PredictiveMetric[] = [
  { id: "m_1", metricName: "Monthly Recurring Growth", currentValue: 124500, projectedValue: 148000, confidenceScore: 92 },
  { id: "m_2", metricName: "Infra Server Compute Load", currentValue: 68.4, projectedValue: 84.1, confidenceScore: 97 },
  { id: "m_3", metricName: "Customer Retention Ratio", currentValue: 91.2, projectedValue: 93.8, confidenceScore: 89 }
];

const INITIAL_JOBS: ModelTrainingJob[] = [
  { id: "job_901", modelName: "XGBoost Supply Chain Predictor", algorithm: "XGBoost v2.1", progress: 85, status: "Training" },
  { id: "job_902", modelName: "Transformer Demand Forecasting", algorithm: "PyTorch Lightning", progress: 100, status: "Completed" },
  { id: "job_903", modelName: "ARIMA Time Series Analysis", algorithm: "StatsModels ARIMA", progress: 0, status: "Queued" }
];

export const useForecastingStore = create<ForecastingState>((set, get) => ({
  perspective: 'subscriber',
  datasets: INITIAL_DATASETS,
  metrics: INITIAL_METRICS,
  trainingJobs: INITIAL_JOBS,
  trainModalOpen: false,

  setPerspective: (val) => set({ perspective: val }),
  openTrainModal: () => set({ trainModalOpen: true }),
  closeTrainModal: () => set({ trainModalOpen: false }),

  triggerModelTraining: (modelName, algorithm) => {
    const { trainingJobs } = get();
    const newJob: ModelTrainingJob = {
      id: `job_${Math.floor(900 + Math.random() * 100)}`,
      modelName,
      algorithm,
      progress: 10,
      status: "Training"
    };
    set({
      trainingJobs: [newJob, ...trainingJobs],
      trainModalOpen: false
    });
  },

  updateJobProgress: (id, progress) => {
    const { trainingJobs } = get();
    set({
      trainingJobs: trainingJobs.map((j) => j.id === id ? { ...j, progress, status: progress >= 100 ? "Completed" : "Training" } : j)
    });
  },

  resetStore: () => set({
    perspective: 'subscriber',
    datasets: INITIAL_DATASETS,
    metrics: INITIAL_METRICS,
    trainingJobs: INITIAL_JOBS,
    trainModalOpen: false
  })
}));

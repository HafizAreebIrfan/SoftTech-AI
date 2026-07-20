import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "../../../../styles/forecasting.module.css";
import { useForecastingStore } from "../../../../infrastructure/store/forecastingStore";

interface ForecastingScreenProps {
  title: string;
  subtitle?: string;
  blocks?: any[];
  isPreview?: boolean;
  previewIndustry?: string;
  setPreviewIndustry?: (val: string) => void;
  renderPreviewControls?: (
    previewIndustry: string,
    setPreviewIndustry: (v: string) => void
  ) => React.ReactNode;
}

export const ForecastingScreen: React.FC<ForecastingScreenProps> = ({
  title,
  subtitle,
  blocks = [],
  isPreview,
  previewIndustry,
  setPreviewIndustry,
  renderPreviewControls,
}) => {
  const {
    perspective,
    datasets,
    metrics,
    trainingJobs,
    trainModalOpen,
    setPerspective,
    openTrainModal,
    closeTrainModal,
    triggerModelTraining
  } = useForecastingStore();

  // Extract dynamic metrics from MCP blocks if provided by ChatGPT tool result
  const displayMetrics = React.useMemo(() => {
    if (blocks && Array.isArray(blocks)) {
      const metricBlock = blocks.find((b: any) => b?.type === "metrics" && Array.isArray(b?.metrics));
      if (metricBlock && metricBlock.metrics.length > 0) {
        return metricBlock.metrics.map((m: any, idx: number) => ({
          id: `dyn_m_${idx}`,
          metricName: m.label || m.title || "Telemetry Metric",
          currentValue: m.value ?? m.currentValue ?? 0,
          projectedValue: m.subValue ?? m.projectedValue ?? m.value,
          confidenceScore: m.score ?? m.confidenceScore ?? 95
        }));
      }
    }
    return metrics;
  }, [blocks, metrics]);

  // Extract dynamic datasets or list items from MCP blocks if provided
  const displayDatasets = React.useMemo(() => {
    if (blocks && Array.isArray(blocks)) {
      const listBlock = blocks.find((b: any) => (b?.type === "list" || b?.type === "table") && (Array.isArray(b?.listItems) || Array.isArray(b?.tableRows)));
      if (listBlock) {
        const items = listBlock.listItems || listBlock.tableRows || [];
        if (items.length > 0) {
          return items.map((item: any, idx: number) => ({
            id: `dyn_ds_${idx}`,
            name: item.title || item.name || item[0] || "Dataset Matrix",
            recordsCount: item.records || item.description ? 120000 + idx * 15000 : 85000,
            accuracyRate: item.accuracy || (92 + (idx % 7) * 0.9).toFixed(1),
            lastTrained: "Just Now"
          }));
        }
      }
    }
    return datasets;
  }, [blocks, datasets]);

  const [modelNameInput, setModelNameInput] = useState("");

  const [algoInput, setAlgoInput] = useState("XGBoost v2.1");

  const handleTrain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelNameInput.trim()) return;
    triggerModelTraining(modelNameInput, algoInput);
    setModelNameInput("");
  };

  return (
    <div className={styles.container}>
      {isPreview && renderPreviewControls && setPreviewIndustry && previewIndustry && (
        <div style={{ marginBottom: "1.5rem", position: "relative", zIndex: 10 }}>
          {renderPreviewControls(previewIndustry, setPreviewIndustry)}
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.titleSec}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle || "Predictive data telemetry & AI model forecasting matrix"}</p>
        </div>

        <div className={styles.perspectiveToggle}>
          <button
            onClick={() => setPerspective('subscriber')}
            className={`${styles.toggleBtn} ${perspective === 'subscriber' ? styles.toggleBtnActive : ""}`}
          >
            Analytics User
          </button>
          <button
            onClick={() => setPerspective('provider')}
            className={`${styles.toggleBtn} ${perspective === 'provider' ? styles.toggleBtnActive : ""}`}
          >
            MLOps Platform Eng
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {perspective === 'subscriber' ? (
          <motion.div
            key="subscriber-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* Forecast Metrics Cards */}
            <div className={styles.statsGrid}>
              {displayMetrics.map((m: any) => (
                <div key={m.id} className={styles.statCard}>
                  <div className={styles.statLabel}>{m.metricName}</div>
                  <div className={styles.statVal}>
                    {typeof m.currentValue === 'number' && m.currentValue > 1000 ? `$${m.currentValue.toLocaleString()}` : m.currentValue}
                    <span style={{ fontSize: "13px", color: "#c084fc", marginLeft: "6px" }}>
                      &rarr; {typeof m.projectedValue === 'number' && m.projectedValue > 1000 ? `$${m.projectedValue.toLocaleString()}` : m.projectedValue}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--app-text-secondary)", marginTop: "6px" }}>
                    Confidence Score: <strong style={{ color: "#10b981" }}>{m.confidenceScore}%</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Registered Datasets List */}
            <div className={styles.mainGrid}>
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Active Data Matrices</h3>
                {displayDatasets.map((ds: any) => (
                  <div key={ds.id} className={styles.datasetCard}>
                    <div style={{ fontWeight: 800, color: "var(--app-text-heading)" }}>{ds.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--app-text-secondary)", marginTop: "4px" }}>
                      {typeof ds.recordsCount === 'number' ? ds.recordsCount.toLocaleString() : ds.recordsCount} Data Points • Accuracy: <span style={{ color: "#c084fc", fontWeight: "bold" }}>{ds.accuracyRate}%</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "6px" }}>
                      Last Checkpoint: {ds.lastTrained}
                    </div>
                  </div>
                ))}
              </div>


              {/* Scenario Simulator */}
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Forecast Model Confidence</h3>
                <div style={{ padding: "16px", background: "rgba(168, 85, 247, 0.05)", borderRadius: "16px", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
                  <div style={{ fontWeight: 800, color: "#c084fc" }}>Telemetry Simulation Status</div>
                  <p style={{ fontSize: "12px", color: "var(--app-text-secondary)", marginTop: "8px", lineHeight: 1.5 }}>
                    Neural network projections indicate a low error probability (&lt;1.8%) over the next 90-day trajectory.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="provider-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* Model training jobs panel */}
            <div className={styles.panel}>
              <div className={styles.panelHeaderRow}>
                <h3 className={styles.panelTitle} style={{ margin: 0 }}>ML Model Training Pipeline Jobs</h3>
                <button onClick={openTrainModal} className={styles.createHeaderBtn}>
                  + Train Model
                </button>
              </div>

              {trainingJobs.map((job) => (
                <div key={job.id} className={styles.datasetCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 800, color: "var(--app-text-heading)" }}>{job.modelName}</div>
                      <div style={{ fontSize: "11px", color: "var(--app-text-secondary)" }}>{job.algorithm}</div>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: job.status === 'Completed' ? '#10b981' : '#c084fc' }}>
                      {job.status} ({job.progress}%)
                    </span>
                  </div>

                  <div className={styles.progressBarBg}>
                    <div className={styles.progressBarFill} style={{ width: `${job.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Train Modal */}
      <AnimatePresence>
        {trainModalOpen && (
          <motion.div
            key="train-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={closeTrainModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>Launch Predictive Model Job</h3>

              <form onSubmit={handleTrain} className={styles.formContainer}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Model Identifier Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q4 Revenue Neural Engine"
                    value={modelNameInput}
                    onChange={(e) => setModelNameInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Algorithm Architecture</label>
                  <select
                    value={algoInput}
                    onChange={(e) => setAlgoInput(e.target.value)}
                    className={styles.selectInput}
                  >
                    <option value="XGBoost v2.1">XGBoost v2.1</option>
                    <option value="PyTorch Transformer">PyTorch Transformer</option>
                    <option value="ARIMA TimeSeries">ARIMA TimeSeries</option>
                    <option value="LightGBM Regressor">LightGBM Regressor</option>
                  </select>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" onClick={closeTrainModal} className={styles.stopBtn}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.actionBtn}>
                    Start Model Training
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useEffect, useMemo } from "react";
import { WeatherToolResultNotification } from "../../../domain/entities/WeatherWidget";
import { useThemeStore } from "../../../hooks";
import {
  adaptWeatherToolResult,
  previewWeatherToolResult,
  useWeatherWidgetStore,
  WEATHER_RESULT_NOTIFICATION,
} from "../../../infrastructure/store/weatherWidgetStore";
import styles from "../../../styles/cardwidget.module.css";

const CardWidget: React.FC = () => {
  const { colors, isDark } = useThemeStore();
  const bridgeConnected = useWeatherWidgetStore(
    (state) => state.bridgeConnected,
  );
  const toolResult = useWeatherWidgetStore((state) => state.toolResult);
  const receiveToolResult = useWeatherWidgetStore(
    (state) => state.receiveToolResult,
  );
  const syncFromOpenAiGlobals = useWeatherWidgetStore(
    (state) => state.syncFromOpenAiGlobals,
  );

  useEffect(() => {
    syncFromOpenAiGlobals(window.openai);

    const handleSetGlobals = (event: WindowEventMap["openai:set_globals"]) => {
      syncFromOpenAiGlobals(event.detail?.globals ?? window.openai);
    };

    const handleMessage = (
      event: MessageEvent<WeatherToolResultNotification>,
    ) => {
      if (event.source !== window.parent) {
        return;
      }

      const message = event.data;

      if (!message || message.jsonrpc !== "2.0") {
        return;
      }

      if (message.method !== WEATHER_RESULT_NOTIFICATION) {
        return;
      }

      receiveToolResult(message.params ?? null);
    };

    window.addEventListener("openai:set_globals", handleSetGlobals, {
      passive: true,
    });
    window.addEventListener("message", handleMessage, { passive: true });

    return () => {
      window.removeEventListener("openai:set_globals", handleSetGlobals);
      window.removeEventListener("message", handleMessage);
    };
  }, [receiveToolResult, syncFromOpenAiGlobals]);

  const effectiveToolResult = toolResult ?? previewWeatherToolResult;
  const weather = useMemo(
    () => adaptWeatherToolResult(effectiveToolResult),
    [effectiveToolResult],
  );

  const debugText =
    effectiveToolResult.content?.find((entry) => entry.type === "text")?.text ??
    null;

  if (!weather) {
    return (
      <section className={styles.widgetShell}>
        <div className={styles.emptyState}>
          <p className={styles.eyebrow}>Weather Card</p>
          <h2 className={styles.title}>Waiting for weather data</h2>
          <p className={styles.description}>
            The widget is ready, but no compatible weather tool result has been
            received yet.
          </p>
          {debugText ? (
            <pre className={styles.debugText}>{debugText}</pre>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.widgetShell}>
      {weather.lastUpdated ? (
        <span className={styles.time}>{weather.lastUpdated}</span>
      ) : null}
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{weather.city}</h2>
          <p className={styles.description}>{weather.condition}</p>
        </div>
        <div className={styles.temperaturePill}>{weather.temperature}</div>
      </header>

      <section className={styles.summaryPanel}>
        <div className={styles.summaryMetric}>
          <span className={styles.metricLabel}>Feels Like</span>
          <strong className={styles.metricValue}>{weather.feelsLike}</strong>
        </div>
        <div className={styles.summaryMetric}>
          <span className={styles.metricLabel}>Humidity</span>
          <strong className={styles.metricValue}>{weather.humidity}</strong>
        </div>
      </section>

      <section className={styles.detailGrid}>
        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>Wind</span>
          <strong className={styles.detailValue}>{weather.wind}</strong>
        </article>
        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>High / Low</span>
          <strong className={styles.detailValue}>{weather.highLow}</strong>
        </article>
      </section>

      {(weather.source || weather.lastUpdated) && (
        <footer className={styles.footer}>
          {weather.source ? (
            <span className={styles.footerItem}>Source: {weather.source}</span>
          ) : null}
        </footer>
      )}

      {!bridgeConnected && debugText ? (
        <details className={styles.debugPanel}>
          <summary>Preview Text Fallback</summary>
          <pre className={styles.debugText}>{debugText}</pre>
        </details>
      ) : null}
    </section>
  );
};

export default CardWidget;

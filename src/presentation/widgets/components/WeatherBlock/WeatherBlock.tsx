import React from "react";
import styles from "../../../../styles/weatherblock.module.css";
import { renderImage } from "../../helper/RenderImage";

export interface WeatherBlockProps {
  data?: any;
  records?: any[];
  title?: string;
  subtitle?: string;
}

export const WeatherBlock: React.FC<WeatherBlockProps> = ({
  data,
  records = [],
  title = "Get Weather & Forecast",
  subtitle = "Live Weather Response",
}) => {
  // Extract location & current data
  const location = data?.location || data?.data?.location || {};
  const current = data?.current || data?.data?.current || {};
  const rawForecast =
    data?.forecast?.forecastday ||
    data?.data?.forecast?.forecastday ||
    (Array.isArray(records) && records.length > 0 ? records : []);

  const locationName = [location.name, location.region, location.country]
    .filter(Boolean)
    .join(", ") || "Weather Report";

  const currentTemp = current.temp_c !== undefined ? current.temp_c : (rawForecast[0]?.day?.maxtemp_c ?? "--");
  const currentCondition = current.condition?.text || rawForecast[0]?.day?.condition?.text || "Clear";
  const currentIcon = current.condition?.icon || rawForecast[0]?.day?.condition?.icon;

  const humidity = current.humidity ?? rawForecast[0]?.day?.avghumidity;
  const windKph = current.wind_kph ?? rawForecast[0]?.day?.maxwind_kph;
  const rainChance = current.chance_of_rain ?? rawForecast[0]?.day?.daily_chance_of_rain;
  const uv = current.uv ?? rawForecast[0]?.day?.uv;

  return (
    <div className={styles.container}>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 650 }}>{title}</h3>
        {subtitle && <p style={{ margin: 0, fontSize: "13px", opacity: 0.6 }}>{subtitle}</p>}
      </div>

      {/* Hero Weather Card */}
      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          {currentIcon && (
            <div className={styles.weatherIcon}>
              {renderImage(currentIcon, currentCondition)}
            </div>
          )}

          <div>
            <div className={styles.tempValue}>
              {currentTemp}<span className={styles.tempUnit}>°C</span>
            </div>
            <div className={styles.conditionText}>{currentCondition}</div>
            <div className={styles.locationText}>{locationName}</div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className={styles.badgeGrid}>
          {humidity !== undefined && (
            <div className={styles.badge}>
              💧 Humidity: <span className={styles.badgeValue}>{humidity}%</span>
            </div>
          )}

          {windKph !== undefined && (
            <div className={styles.badge}>
              💨 Wind: <span className={styles.badgeValue}>{windKph} km/h</span>
            </div>
          )}

          {rainChance !== undefined && (
            <div className={styles.badge}>
              🌧️ Rain Chance: <span className={styles.badgeValue}>{rainChance}%</span>
            </div>
          )}

          {uv !== undefined && (
            <div className={styles.badge}>
              ☀️ UV Index: <span className={styles.badgeValue}>{uv}</span>
            </div>
          )}
        </div>
      </div>

      {/* Forecast Strip */}
      {Array.isArray(rawForecast) && rawForecast.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h4 className={styles.forecastTitle}>Daily Forecast</h4>

          <div className={styles.forecastGrid}>
            {rawForecast.map((dayItem: any, idx: number) => {
              const dayObj = dayItem.day || {};
              const dateStr = dayItem.date || `Day ${idx + 1}`;
              const maxT = dayObj.maxtemp_c ?? "--";
              const minT = dayObj.mintemp_c ?? "--";
              const condIcon = dayObj.condition?.icon;
              const chanceRain = dayObj.daily_chance_of_rain;

              return (
                <div key={idx} className={styles.forecastCard}>
                  <span className={styles.forecastDate}>{dateStr}</span>

                  {condIcon && (
                    <div className={styles.forecastIcon}>
                      {renderImage(condIcon, dayObj.condition?.text || "Weather")}
                    </div>
                  )}

                  <div className={styles.forecastTemps}>
                    <span className={styles.maxTemp}>{maxT}°</span>
                    <span className={styles.minTemp}>{minT}°</span>
                  </div>

                  {chanceRain !== undefined && (
                    <span className={styles.forecastRain}>💧 {chanceRain}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

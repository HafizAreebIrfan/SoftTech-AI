import React from "react";
import styles from "../../../../styles/weatherblock.module.css";
import { renderImage } from "../../helper/RenderImage";
import {
  getWeatherConditionSvg,
  HumidityIcon,
  RainIcon,
  UvIcon,
  WindIcon,
} from "../../../../assets/icons/WeatherIcons";

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
  const location = data?.location || data?.data?.location || {};
  const current = data?.current || data?.data?.current || {};
  const rawForecast =
    data?.forecast?.forecastday ||
    data?.data?.forecast?.forecastday ||
    (Array.isArray(records) && records.length > 0 ? records : []);

  const textSummary = data?.summary || data?.text || data?.data?.text;

  const locationName =
    [location.name, location.region, location.country]
      .filter(Boolean)
      .join(", ") || "Weather Report";

  const currentTemp =
    current.temp_c !== undefined
      ? current.temp_c
      : (rawForecast[0]?.day?.maxtemp_c ?? "--");
  const currentCondition =
    current.condition?.text || rawForecast[0]?.day?.condition?.text || "Clear";
  const currentIcon =
    current.condition?.icon || rawForecast[0]?.day?.condition?.icon;

  const humidity = current.humidity ?? rawForecast[0]?.day?.avghumidity;
  const windKph = current.wind_kph ?? rawForecast[0]?.day?.maxwind_kph;
  const rainChance =
    current.chance_of_rain ?? rawForecast[0]?.day?.daily_chance_of_rain;
  const uv = current.uv ?? rawForecast[0]?.day?.uv;

  const feelsLike = current.feelslike_c;

  return (
    <div className={styles.container}>
      <div className={styles.headerGroup}>
        <h3 className={styles.mainTitle}>{title}</h3>
        {subtitle && <p className={styles.subTitle}>{subtitle}</p>}
      </div>

      {textSummary && (
        <div className={styles.summaryTextBanner}>{textSummary}</div>
      )}

      {/* Hero Weather Card */}
      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.weatherIcon}>
            {currentIcon
              ? renderImage(currentIcon, currentCondition)
              : getWeatherConditionSvg(currentCondition, 48)}
          </div>

          <div>
            <div className={styles.tempValue}>
              {currentTemp}
              <span className={styles.tempUnit}>°C</span>
            </div>
            <div className={styles.conditionText}>{currentCondition}</div>
            {feelsLike !== undefined && (
              <div
                style={{ fontSize: "12px", opacity: 0.75, marginTop: "2px" }}
              >
                Feels like {feelsLike}°C
              </div>
            )}
            <div className={styles.locationText}>{locationName}</div>
          </div>
        </div>

        {/* Dynamic Metric SVG Badges */}
        <div className={styles.badgeGrid}>
          {humidity !== undefined && (
            <div className={styles.badge}>
              <HumidityIcon size={16} />
              Humidity: <span className={styles.badgeValue}>{humidity}%</span>
            </div>
          )}

          {windKph !== undefined && (
            <div className={styles.badge}>
              <WindIcon size={16} />
              Wind: <span className={styles.badgeValue}>{windKph} km/h</span>
            </div>
          )}

          {rainChance !== undefined && (
            <div className={styles.badge}>
              <RainIcon size={16} />
              Rain Chance:{" "}
              <span className={styles.badgeValue}>{rainChance}%</span>
            </div>
          )}

          {uv !== undefined && (
            <div className={styles.badge}>
              <UvIcon size={16} />
              UV Index: <span className={styles.badgeValue}>{uv}</span>
            </div>
          )}
        </div>
      </div>

      {/* Forecast Strip (Only shown for multi-day forecasts) */}
      {Array.isArray(rawForecast) && rawForecast.length > 1 && (
        <div className={styles.forecastContainer}>
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

                  <div className={styles.forecastIcon}>
                    {condIcon
                      ? renderImage(
                          condIcon,
                          dayObj.condition?.text || "Weather",
                        )
                      : getWeatherConditionSvg(dayObj.condition?.text, 28)}
                  </div>

                  <div className={styles.forecastTemps}>
                    <span className={styles.maxTemp}>{maxT}°</span>
                    <span className={styles.minTemp}>{minT}°</span>
                  </div>

                  {chanceRain !== undefined && (
                    <span className={styles.forecastRain}>
                      Rain: {chanceRain}%
                    </span>
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

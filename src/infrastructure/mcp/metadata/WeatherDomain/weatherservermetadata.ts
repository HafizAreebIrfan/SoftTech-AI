import { CompanyMcpMetadata } from "../../../../domain/interface/companymetadatainterface";

export const weatherServerMetadata: CompanyMcpMetadata = {
  companyId: "WeatherWayApp",
  companySlug: "Weather on the spot.",
  serverName: "Weather Server",
  serverVersion: "1.0.0",
  domain: "weather",
  summary:
    "Provides current weather, forecast, and air quality information for cities using standardized weather tools.",
  recommendationHints: [
    "Use this server for weather, forecast, and air quality questions.",
    "Prefer this server when a user asks about temperature, humidity, wind, forecast, or city air quality.",
  ],
  intents: {
    supported: [
      "current weather lookup",
      "multi-day forecast lookup",
      "city air quality lookup",
    ],
    unsupported: [
      "severe weather alerts",
      "historical climate reports",
      "weather map rendering",
    ],
    keywords: [
      "weather",
      "forecast",
      "temperature",
      "humidity",
      "air quality",
      "wind",
    ],
    examplePrompts: [
      "What is the weather in Karachi?",
      "Show me the 4 day forecast for Lahore.",
      "How is the air quality in Islamabad today?",
    ],
  },
  tools: [
    {
      id: "weather.current",
      canonicalName: "get_weather_data",
      displayName: "Current Weather",
      description: "Returns current weather information for a city in Celsius.",
      mode: "read",
      tags: ["weather", "current", "temperature", "celsius"],
      enabledByDefault: true,
      input: [
        {
          key: "city",
          type: "string",
          description: "City name to look up.",
          required: true,
          example: "Karachi",
        },
      ],
      output: [
        {
          key: "city",
          type: "string",
          description: "Resolved city name.",
          required: true,
        },
        {
          key: "temperature",
          type: "number",
          description: "Current temperature in Celsius.",
          required: true,
        },
        {
          key: "condition",
          type: "string",
          description: "Current weather condition text.",
          required: true,
        },
        {
          key: "windDirection",
          type: "string",
          description: "Wind direction cardinal value.",
          required: true,
        },
        {
          key: "windSpeed",
          type: "number",
          description: "Wind speed in kph.",
          required: true,
        },
        {
          key: "high",
          type: "number",
          description: "Today's high in Celsius.",
          required: true,
        },
        {
          key: "low",
          type: "number",
          description: "Today's low in Celsius.",
          required: true,
        },
        {
          key: "feelsLike",
          type: "number",
          description: "Feels-like temperature in Celsius.",
          required: true,
        },
        {
          key: "humidity",
          type: "number",
          description: "Humidity percentage.",
          required: true,
        },
      ],
      examplePrompts: [
        "What's the weather in Dubai?",
        "Tell me the current temperature in Karachi.",
      ],
    },
  ],
  apiMappings: [
    {
      toolId: "weather.current",
      endpointName: "weatherapi forecast endpoint",
      method: "GET",
      path: "/v1/forecast.json",
      authType: "api_key",
      inputFieldMap: {
        city: "q",
      },
      outputFieldMap: {
        city: "location.name",
        temperature: "current.temp_c",
        condition: "current.condition.text",
        windDirection: "current.wind_dir",
        windSpeed: "current.wind_kph",
        high: "forecast.forecastday[0].day.maxtemp_c",
        low: "forecast.forecastday[0].day.mintemp_c",
        feelsLike: "current.feelslike_c",
        humidity: "current.humidity",
      },
      samples: [
        {
          label: "current weather sample",
          request: { q: "Karachi", days: 4 },
          response: {
            location: { name: "Karachi" },
            current: {
              temp_c: 32,
              wind_dir: "SW",
              wind_kph: 18,
              feelslike_c: 36,
              humidity: 58,
              condition: { text: "Sunny" },
            },
            forecast: {
              forecastday: [
                {
                  day: { maxtemp_c: 34, mintemp_c: 28 },
                },
              ],
            },
          },
        },
      ],
    },
  ],
};

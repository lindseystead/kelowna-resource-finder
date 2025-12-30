/**
 * @fileoverview Weather widget component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Displays current weather and temperature for Kelowna, BC.
 * Shows warnings for cold weather conditions.
 */

import { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, Snowflake, AlertTriangle, Thermometer } from "lucide-react";

interface WeatherData {
  temp: number;
  condition: string;
  feelsLike: number;
  low: number;
  high: number;
  warning?: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fetch weather from Open-Meteo API (free, no API key required)
    // Using Kelowna, BC coordinates: 49.8880° N, 119.4960° W
    const fetchWeather = async () => {
      try {
        // Open-Meteo free weather API - no key required
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=49.8880&longitude=-119.4960&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=America/Vancouver&temperature_unit=celsius`
        );
        
        if (response.ok) {
          const data = await response.json();
          const temp = Math.round(data.current.temperature_2m);
          const weatherCode = data.current.weather_code;
          const low = Math.round(data.daily.temperature_2m_min[0]);
          const high = Math.round(data.daily.temperature_2m_max[0]);
          
          // Convert WMO weather code to condition string
          let condition = "clear";
          if (weatherCode >= 1 && weatherCode <= 3) condition = "cloud";
          else if (weatherCode >= 45 && weatherCode <= 49) condition = "cloud";
          else if (weatherCode >= 51 && weatherCode <= 67) condition = "rain";
          else if (weatherCode >= 71 && weatherCode <= 77) condition = "snow";
          else if (weatherCode >= 80 && weatherCode <= 86) condition = "rain";
          else if (weatherCode >= 95 && weatherCode <= 99) condition = "rain";
          
          // Simple feels like approximation (can be enhanced with wind/humidity if needed)
          const feelsLike = temp;
          
          let warning: string | undefined;
          if (temp < 0) {
            warning = "Freezing temperatures";
          } else if (temp < 5) {
            warning = "Very cold conditions";
          } else if (low < 0) {
            warning = "Freezing overnight";
          } else if (low < 5) {
            warning = "Cold overnight";
          }
          
          setWeather({
            temp,
            condition,
            feelsLike,
            low,
            high,
            warning,
          });
          setError(false);
        } else {
          throw new Error("Weather API error");
        }
      } catch (err) {
        // Fail silently - don't show widget if API fails
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (condition: string) => {
    if (condition.includes("rain")) return <CloudRain className="w-4 h-4 sm:w-5 sm:h-5" />;
    if (condition.includes("snow")) return <Snowflake className="w-4 h-4 sm:w-5 sm:h-5" />;
    if (condition.includes("cloud")) return <Cloud className="w-4 h-4 sm:w-5 sm:h-5" />;
    return <Sun className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-200 px-3 sm:px-4 py-1.5 sm:py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm text-blue-700">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    // Don't show anything if weather fails - fail gracefully
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-200 px-3 sm:px-4 py-1.5 sm:py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-blue-900">
          <div className="text-blue-600">
            {getWeatherIcon(weather.condition)}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-semibold">{weather.temp}°C</span>
            <span className="text-blue-700 hidden sm:inline">Kelowna</span>
          </div>
          {weather.warning && (
            <div className="flex items-center gap-1 text-amber-700 ml-2 sm:ml-3">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium text-xs sm:text-sm">{weather.warning}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-blue-700 hidden sm:flex items-center gap-1">
          <span>Feels like {weather.feelsLike}°C</span>
          <span className="text-blue-500">•</span>
          <span>{weather.low}°/{weather.high}°</span>
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from "react";
import { 
  CloudSun, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  Compass, 
  Sun, 
  AlertTriangle,
  Home,
  CheckCircle2,
  Cpu,
  Info
} from "lucide-react";

interface WeatherData {
  city: string;
  country: string;
  outdoorTemp: number; // Celsius
  condition: "Sunny" | "Cloudy" | "Raining" | "Snowing" | "Windy" | "Arid" | "Misty" ;
  humidity: number; // %
  windSpeed: number; // km/h
  uvIndex: number;
  aqi: number; // 0-500
  indoorTemp: number; // Celsius
  indoorHumidity: number; // %
  co2: number; // ppm
  purifierMode: "Eco" | "Max Boost" | "Manual-Silent";
}

const PRESET_LOCATIONS: Record<string, WeatherData> = {
  india: {
    city: "New Delhi",
    country: "India",
    outdoorTemp: 32,
    condition: "Sunny",
    humidity: 45,
    windSpeed: 12,
    uvIndex: 8,
    aqi: 142,
    indoorTemp: 22.5,
    indoorHumidity: 44,
    co2: 460,
    purifierMode: "Eco"
  },
  tokyo: {
    city: "Tokyo",
    country: "Japan",
    outdoorTemp: 19,
    condition: "Sunny",
    humidity: 55,
    windSpeed: 12,
    uvIndex: 4,
    aqi: 32,
    indoorTemp: 22,
    indoorHumidity: 48,
    co2: 440,
    purifierMode: "Eco"
  },
  reykjavik: {
    city: "Reykjavik",
    country: "Iceland",
    outdoorTemp: 4,
    condition: "Snowing",
    humidity: 82,
    windSpeed: 28,
    uvIndex: 1,
    aqi: 12,
    indoorTemp: 23,
    indoorHumidity: 42,
    co2: 380,
    purifierMode: "Eco"
  },
  newyork: {
    city: "New York",
    country: "USA",
    outdoorTemp: 15,
    condition: "Cloudy",
    humidity: 68,
    windSpeed: 18,
    uvIndex: 2,
    aqi: 65,
    indoorTemp: 21,
    indoorHumidity: 52,
    co2: 510,
    purifierMode: "Max Boost"
  },
  sahara: {
    city: "Tamanrasset (Sahara)",
    country: "Algeria",
    outdoorTemp: 38,
    condition: "Arid",
    humidity: 12,
    windSpeed: 22,
    uvIndex: 11,
    aqi: 110,
    indoorTemp: 24,
    indoorHumidity: 28,
    co2: 405,
    purifierMode: "Manual-Silent"
  },
  sydney: {
    city: "Sydney",
    country: "Australia",
    outdoorTemp: 24,
    condition: "Sunny",
    humidity: 60,
    windSpeed: 14,
    uvIndex: 7,
    aqi: 24,
    indoorTemp: 22.5,
    indoorHumidity: 50,
    co2: 425,
    purifierMode: "Eco"
  },
  amazon: {
    city: "Manaus (Amazon Rain Forest)",
    country: "Brazil",
    outdoorTemp: 30,
    condition: "Raining",
    humidity: 95,
    windSpeed: 8,
    uvIndex: 9,
    aqi: 18,
    indoorTemp: 23,
    indoorHumidity: 60,
    co2: 360,
    purifierMode: "Max Boost"
  }
};

const PRESET_COORDS: Record<string, { lat: number; lng: number; city: string; country: string }> = {
  india: { lat: 28.6139, lng: 77.2090, city: "New Delhi", country: "India" },
  tokyo: { lat: 35.6762, lng: 139.6503, city: "Tokyo", country: "Japan" },
  reykjavik: { lat: 64.1466, lng: -21.9426, city: "Reykjavik", country: "Iceland" },
  newyork: { lat: 40.7128, lng: -74.0060, city: "New York", country: "USA" },
  sahara: { lat: 22.7850, lng: 5.5228, city: "Tamanrasset (Sahara)", country: "Algeria" },
  sydney: { lat: -33.8688, lng: 151.2093, city: "Sydney", country: "Australia" },
  amazon: { lat: -3.1190, lng: -60.0217, city: "Manaus (Amazon Rain Forest)", country: "Brazil" }
};

export const DashboardWeather: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>(() => {
    return localStorage.getItem("omnilife_weather_preset") || "india";
  });
  
  const [customCity, setCustomCity] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isFahrenheit, setIsFahrenheit] = useState(() => {
    return localStorage.getItem("omnilife_temp_unit") === "F";
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [weather, setWeather] = useState<WeatherData>(() => {
    const saved = localStorage.getItem("omnilife_custom_weather");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return PRESET_LOCATIONS.india;
  });

  const fetchRealWeatherForCoordinates = async (
    lat: number,
    lng: number,
    labelCity: string,
    labelCountry: string
  ) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=uv_index&timezone=auto&forecast_days=1`;
      const response = await fetch(weatherUrl);
      if (!response.ok) throw new Error("Could not download weather forecast from server index.");
      const data = await response.json();

      const current = data.current;
      const hourly = data.hourly || {};
      
      // Find current UV index
      let uv = 5;
      if (hourly.uv_index && hourly.uv_index.length > 0) {
        const hourIdx = new Date().getHours();
        uv = Math.round(hourly.uv_index[hourIdx] ?? hourly.uv_index[12] ?? 5);
      }

      // Map weather code representation
      const code = current.weather_code;
      let cond: WeatherData["condition"] = "Sunny";
      if (code === 0) cond = "Sunny";
      else if (code >= 1 && code <= 3) cond = "Cloudy";
      else if (code === 45 || code === 48) cond = "Misty";
      else if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) {
        cond = "Raining";
      } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        cond = "Snowing";
      } else {
        cond = "Cloudy";
      }

      // Fetch Air Quality index free API
      let aqiValue = 42;
      try {
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi`;
        const aqiRes = await fetch(aqiUrl);
        if (aqiRes.ok) {
          const aqiData = await aqiRes.json();
          if (aqiData.current && typeof aqiData.current.us_aqi === "number") {
            aqiValue = aqiData.current.us_aqi;
          }
        }
      } catch (e) {
        aqiValue = Math.floor(Math.random() * 40) + 20;
      }

      const activeResult: WeatherData = {
        city: labelCity,
        country: labelCountry,
        outdoorTemp: current.temperature_2m,
        condition: cond,
        humidity: current.relative_humidity_2m ?? 50,
        windSpeed: Math.round(current.wind_speed_10m ?? 12),
        uvIndex: uv,
        aqi: aqiValue,
        indoorTemp: weather?.indoorTemp || 22.0,
        indoorHumidity: weather?.indoorHumidity || 45,
        co2: weather?.co2 || 420,
        purifierMode: weather?.purifierMode || "Eco"
      };

      setWeather(activeResult);
      localStorage.setItem("omnilife_custom_weather", JSON.stringify(activeResult));
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Failed to parse system temperature telemetry.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerGpsDeviceSync = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setSelectedPreset("gps");
      setWeather((prev) => ({
        ...prev,
        city: "Precision Geolocation...",
        country: "Approve device sensor dial..."
      }));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          fetchRealWeatherForCoordinates(
            lat,
            lng,
            `Local GPS Coord`,
            `Position: [${lat.toFixed(2)}N, ${lng.toFixed(2)}E]`
          );
        },
        (err) => {
          console.warn("GPS sensor access rejected. Falling back to India preset", err);
          fetchRealWeatherForCoordinates(
            28.6139,
            77.2090,
            "New Delhi",
            "India (Sensor Fallback)"
          );
        },
        { enableHighAccuracy: false, timeout: 8055, maximumAge: 300000 }
      );
    } else {
      setApiError("Browser Geolocation is not supported on this device ecosystem.");
    }
  };

  // Keep saved presets updated
  useEffect(() => {
    localStorage.setItem("omnilife_weather_preset", selectedPreset);
    if (selectedPreset === "gps") {
      triggerGpsDeviceSync();
    } else if (PRESET_COORDS[selectedPreset]) {
      const presetInfo = PRESET_COORDS[selectedPreset];
      fetchRealWeatherForCoordinates(presetInfo.lat, presetInfo.lng, presetInfo.city, presetInfo.country);
    }
  }, [selectedPreset]);

  useEffect(() => {
    localStorage.setItem("omnilife_temp_unit", isFahrenheit ? "F" : "C");
  }, [isFahrenheit]);

  const searchAndDeployCity = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=1&language=en&format=json`;
      const response = await fetch(geoUrl);
      if (!response.ok) throw new Error("Could not match the custom query with geolocator reference.");
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const place = data.results[0];
        const lat = place.latitude;
        const lng = place.longitude;
        const placeCity = place.name;
        const placeCountry = place.country || "Global Region";

        await fetchRealWeatherForCoordinates(lat, lng, placeCity, placeCountry);
        setSelectedPreset("custom");
        setCustomCity("");
      } else {
        throw new Error(`Location "${query}" coordinates could not be indexed.`);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Custom weather location fetch failure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomWeatherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCity.trim()) return;
    await searchAndDeployCity(customCity);
    setShowCustomInput(false);
  };

  const handleUpdateIndoorValue = (field: "indoorTemp" | "indoorHumidity" | "co2", delta: number) => {
    const updated = { ...weather };
    if (field === "indoorTemp") {
      updated.indoorTemp = parseFloat((updated.indoorTemp + delta).toFixed(1));
    } else {
      updated[field] = Math.max(10, updated[field] + delta);
    }
    setWeather(updated);
    localStorage.setItem("omnilife_custom_weather", JSON.stringify(updated));
  };

  const cyclePurifier = () => {
    const modes: WeatherData["purifierMode"][] = ["Eco", "Max Boost", "Manual-Silent"];
    const currentIdx = modes.indexOf(weather.purifierMode);
    const nextIdx = (currentIdx + 1) % modes.length;
    const updated = { ...weather, purifierMode: modes[nextIdx] };
    
    // Auto adjust CO2 if max boost is activated
    if (modes[nextIdx] === "Max Boost") {
      updated.co2 = Math.max(350, weather.co2 - 40);
    } else if (modes[nextIdx] === "Manual-Silent") {
      updated.co2 = weather.co2 + 25;
    }

    setWeather(updated);
    localStorage.setItem("omnilife_custom_weather", JSON.stringify(updated));
  };

  const toDisplayTemp = (celsius: number) => {
    if (isFahrenheit) {
      return Math.round((celsius * 9) / 5 + 32) + "°F";
    }
    return celsius.toFixed(1) + "°C";
  };

  // Calculate comforting stats
  const getIndoorComfortLevel = () => {
    const t = weather.indoorTemp;
    const h = weather.indoorHumidity;
    const co2 = weather.co2;

    if (co2 > 1000) {
      return { label: "⚠️ Stuffy / Poor CO2 ventilation", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", sub: "Open a window to optimize cognitive speed!" };
    }
    if (t >= 20 && t <= 24 && h >= 40 && h <= 60) {
      return { label: "🎯 Perfect Comfort / Flow-State Zone", color: "text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20", sub: "Deep biological alignment. Excellent productivity environment." };
    }
    if (t < 18) {
      return { label: "❄️ Chilly Indoor Environment", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", sub: "Thermal alert: Wear layers to conserve focal energy." };
    }
    if (t > 26) {
      return { label: "🔥 Warm / Fatiguing Thermal Level", color: "text-rose-400 bg-rose-500/10 border-rose-500/20", sub: "Turn on indoor airflow or boost purifier to fight lethargy." };
    }
    return { label: "👍 Average Comfort Quality", color: "text-slate-300 bg-slate-500/10 border-slate-500/20", sub: "Conditions are standard. Habit alignment is active." };
  };

  const comfortState = getIndoorComfortLevel();

  // AQI calculations
  const getAqiExplanation = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "text-emerald-400" };
    if (aqi <= 100) return { label: "Moderate", color: "text-amber-300" };
    return { label: "Unhealthy / Sand", color: "text-red-400" };
  };

  const aqiInfo = getAqiExplanation(weather.aqi);

  const getConditionIcon = (cond: WeatherData["condition"]) => {
    switch (cond) {
      case "Sunny": return <Sun className="text-amber-400 animate-spin-slow" size={28} />;
      case "Cloudy": return <CloudSun className="text-slate-400" size={28} />;
      case "Raining": return <CloudSun className="text-blue-400 animate-pulse" size={28} />;
      case "Snowing": return <CloudSun className="text-sky-200" size={28} />;
      case "Windy": return <Wind className="text-teal-400" size={28} />;
      case "Arid": return <Sun className="text-orange-500" size={28} />;
      default: return <CloudSun className="text-slate-200" size={28} />;
    }
  };

  return (
    <div className="bg-[#111120] border border-[#2a2a50] rounded-2xl p-5 shadow-lg space-y-4 text-left font-sans transition-all duration-300 relative">
      
      {/* Loading overlay for live fetch */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0d0d1a]/85 backdrop-blur-sm rounded-2xl z-20 flex flex-col items-center justify-center space-y-2 text-center select-none font-mono animate-fadeIn">
          <div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-slate-300 uppercase tracking-widest font-black">Syncing Live Bio-Climate Feed...</p>
        </div>
      )}

      {/* Geocoding or fetch exceptions block */}
      {apiError && (
        <div className="p-2.5 bg-rose-550/10 border border-rose-550/30 text-rose-450 rounded-xl text-[10px] flex items-center gap-2 font-mono">
          <span className="shrink-0 bg-rose-500/20 px-1 py-0.5 rounded font-bold">⚠️ SATELLITE DISCOVERY ERROR</span>
          <span className="text-slate-200">{apiError}</span>
          <button 
            type="button" 
            onClick={() => setApiError(null)} 
            className="ml-auto text-slate-400 hover:text-white font-black hover:underline uppercase text-[9px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Controller row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#2a2a50]/60 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <MapPin size={16} className="text-[#ff6b1a] shrink-0" />
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#ff6b1a] font-mono">
            🌍 Bio-Climate & Environment Desk
          </h3>
          <span className="text-[9px] bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30 px-1.5 py-0.5 rounded font-bold font-mono inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            {weather.city.toUpperCase()}
          </span>

          {/* Manual Refresh Trigger button */}
          <button
            type="button"
            onClick={() => {
              if (selectedPreset === "gps") {
                triggerGpsDeviceSync();
              } else if (PRESET_COORDS[selectedPreset]) {
                const presetInfo = PRESET_COORDS[selectedPreset];
                fetchRealWeatherForCoordinates(presetInfo.lat, presetInfo.lng, presetInfo.city, presetInfo.country);
              }
            }}
            className="p-1 px-2 rounded bg-slate-900 hover:bg-[#ff6b1a]/25 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer text-[8px] font-mono font-bold flex items-center gap-1 shrink-0 uppercase"
            title="Force refresh actual ambient coordinates data"
          >
            🔄 Sync Real-Time Feed
          </button>
        </div>
        
        {/* Preset Selectors */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] text-slate-500 uppercase font-bold font-mono">Presets:</span>
          
          <button
            onClick={() => setSelectedPreset("gps")}
            className={`px-2 py-0.5 text-[9px] font-black tracking-tighter uppercase rounded transition flex items-center gap-1 ${
              selectedPreset === "gps" 
              ? "bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/50 animate-pulse" 
              : "bg-slate-900 text-slate-400 border border-transparent hover:text-white"
            }`}
            title="Track current location from browser GPS sensor"
          >
            📡 Real-Time GPS
          </button>

          {Object.keys(PRESET_COORDS).map((p) => (
            <button
              key={p}
              onClick={() => {
                setSelectedPreset(p);
                setShowCustomInput(false);
              }}
              className={`px-2 py-0.5 text-[9px] font-black tracking-tighter uppercase rounded transition ${
                selectedPreset === p 
                ? "bg-[#ff6b1a]/25 text-[#ff6b1a] border border-[#ff6b1a]/50" 
                : "bg-slate-900 text-slate-400 border border-transparent hover:text-slate-200"
              }`}
            >
              {p === "india" ? "India 🇮🇳" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}

          {/* Inline Custom search option */}
          {showCustomInput ? (
            <form onSubmit={handleCustomWeatherSubmit} className="flex items-center gap-1 bg-[#1b1b2f] p-1 py-0.5 rounded border border-[#ff6b1a]/40 animate-fadeIn shrink-0">
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="Type City, Country..."
                className="bg-black/40 text-[#00ff88] text-[9px] px-1.5 py-0.5 rounded focus:outline-none focus:border-[#00ff88] font-mono h-5 w-[140px]"
                autoFocus
              />
              <button 
                type="submit" 
                className="px-1.5 py-0.5 bg-[#00ff88]/15 hover:bg-[#00ff88]/35 text-[#00ff88] text-[8px] font-black font-mono rounded cursor-pointer transition uppercase shrink-0"
              >
                Go
              </button>
              <button 
                type="button" 
                onClick={() => setShowCustomInput(false)} 
                className="text-slate-500 hover:text-rose-450 text-[11px] px-1 font-bold select-none cursor-pointer shrink-0"
                title="Cancel search"
              >
                ×
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setCustomCity("");
                setShowCustomInput(true);
              }}
              className="px-2 py-0.5 text-[9px] font-black tracking-tighter uppercase rounded bg-slate-950 border border-[#00ff88]/20 hover:border-[#00ff88]/60 text-slate-400 hover:text-[#00ff88] transition flex items-center gap-1 cursor-pointer"
              title="Deploy coordinates for any city search location"
            >
              🗺️ Search Location
            </button>
          )}
          
          {/* Temperature unit switcher */}
          <button
            onClick={() => setIsFahrenheit(!isFahrenheit)}
            className="ml-1 bg-[#1a1a2e] text-[#00d4ff] hover:text-[#00ff88] border border-[#2a2a50] rounded-lg px-2 py-0.5 text-[9px] font-mono font-extrabold transition uppercase"
            title="Toggle Fahrenheit / Celsius"
          >
            {isFahrenheit ? "→ °C" : "→ °F"}
          </button>
        </div>
      </div>

      {/* Main Stats Split Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* OUTDOOR WORKSTATION */}
        <div className="p-4 bg-[#0d0d1a] border border-[#2a2a50]/40 rounded-xl space-y-3 relative overflow-hidden group">
          <div className="absolute right-3 top-3 opacity-15">
            <Compass size={55} className="text-slate-500 animate-spin-slow" />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-sky-400 font-extrabold uppercase tracking-widest font-mono">
              [ Outdoor Station ]
            </span>
          </div>

          <div className="flex items-center gap-3">
            {getConditionIcon(weather.condition)}
            <div>
              <p className="text-2xl font-black text-white font-display">
                {toDisplayTemp(weather.outdoorTemp)}
              </p>
              <p className="text-[10px] text-slate-450 uppercase tracking-widest font-bold tracking-tight font-mono text-slate-400">
                {weather.condition} in {weather.city}, {weather.country}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#2a2a50]/20">
            <div>
              <p className="text-[8px] uppercase font-mono text-slate-500">Humidity</p>
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <Droplets size={10} className="text-sky-400" /> {weather.humidity}%
              </p>
            </div>
            <div>
              <p className="text-[8px] uppercase font-mono text-slate-500">Wind Force</p>
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1 font-mono">
                <Wind size={10} className="text-teal-400" /> {weather.windSpeed} km/h
              </p>
            </div>
            <div>
              <p className="text-[8px] uppercase font-mono text-slate-500">UV Index</p>
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1 font-mono">
                ☀️ {weather.uvIndex} <span className="text-[8px] text-slate-500 font-black">{weather.uvIndex >= 8 ? "(HIGH)" : "(MED)"}</span>
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[10px] border-t border-[#2a2a50]/20 font-mono">
            <span className="text-slate-550 text-slate-500">Outdoor Air Quality:</span>
            <span className={`font-black ${aqiInfo.color} uppercase`}>
              AQI {weather.aqi} ({aqiInfo.label})
            </span>
          </div>
        </div>

        {/* INDOOR FOCAL BIOME */}
        <div className="p-4 bg-[#0d0d1a] border border-[#2a2a50]/40 rounded-xl space-y-3 relative overflow-hidden group">
          <div className="absolute right-3 top-3 opacity-15">
            <Home size={55} className="text-[#00ff88]" />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#00ff88] font-extrabold uppercase tracking-widest font-mono">
              [ Indoor Biome Controls ]
            </span>
            <span className="text-[8px] bg-[#00ff88]/5 text-[#00ff88] border border-[#00ff88]/30 px-1 py-0.5 rounded font-mono font-bold uppercase">
              Offline Sensors Active
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Thermometer className="text-[#00ff88] animate-bounce-slow" size={24} />
              <div>
                <p className="text-2xl font-black text-white font-display">
                  {toDisplayTemp(weather.indoorTemp)}
                </p>
                <p className="text-[10px] mt-0.5 text-slate-400 font-bold uppercase font-mono">
                  Relative Humid: {weather.indoorHumidity}%
                </p>
              </div>
            </div>

            {/* Manual Tweak Widgets */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1 scale-90">
                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-tighter">TEMP:</span>
                <button 
                  onClick={() => handleUpdateIndoorValue("indoorTemp", -0.5)}
                  className="w-4 h-4 bg-slate-900 border border-slate-700 hover:border-[#ff6b1a] rounded text-[8px] font-bold text-center"
                >
                  -
                </button>
                <button 
                  onClick={() => handleUpdateIndoorValue("indoorTemp", 0.5)}
                  className="w-4 h-4 bg-slate-900 border border-slate-700 hover:border-[#ff6b1a] rounded text-[8px] font-bold text-center"
                >
                  +
                </button>
              </div>
              <div className="flex items-center gap-1 scale-90">
                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-tighter">HUMD:</span>
                <button 
                  onClick={() => handleUpdateIndoorValue("indoorHumidity", -2)}
                  className="w-4 h-4 bg-slate-900 border border-slate-700 hover:border-[#ff6b1a] rounded text-[8px] font-bold text-center"
                >
                  -
                </button>
                <button 
                  onClick={() => handleUpdateIndoorValue("indoorHumidity", 2)}
                  className="w-4 h-4 bg-slate-900 border border-slate-700 hover:border-[#ff6b1a] rounded text-[8px] font-bold text-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2a2a50]/20 text-[10px]">
            <div>
              <p className="text-[8px] uppercase font-mono text-slate-500 mb-0.5">Carbon Dioxide CO2</p>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${weather.co2 < 600 ? "bg-[#00ff88]" : weather.co2 < 1000 ? "bg-yellow-400" : "bg-red-400"}`} />
                <span className="font-bold text-slate-200 font-mono">{weather.co2} ppm</span>
                <span className="text-[7px] text-slate-500">
                  {weather.co2 < 600 ? "(Excellent)" : "(Moderate)"}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[8px] uppercase font-mono text-slate-500 mb-0.5">Air Purifier</p>
              <button
                onClick={cyclePurifier}
                className="text-[9px] uppercase font-black bg-[#ff6b1a]/15 text-[#ff6b1a] border border-[#ff6b1a]/30 rounded-md px-2 py-0.5 flex items-center gap-1 animate-pulse"
              >
                <Cpu size={10} /> {weather.purifierMode}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comfort Level Gauge Block */}
      <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition duration-200 ${comfortState.color}`}>
        <div className="flex items-start gap-2">
          <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-black tracking-wide uppercase font-mono text-[10px]">
              {comfortState.label}
            </p>
            <p className="text-[10px] text-slate-300 tracking-wide">
              {comfortState.sub}
            </p>
          </div>
        </div>
        <span className="text-[9px] font-bold text-right text-slate-400 uppercase font-mono shrink-0">
          HEALTH COMPLIANCE LEVEL: 98%
        </span>
      </div>
    </div>
  );
};

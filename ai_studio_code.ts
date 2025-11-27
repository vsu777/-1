import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CityData, ThemeMode } from './types';
import { LOCAL_STORAGE_KEY, THEME_CONFIG } from './constants';
import { searchCityLocation } from './services/amapService'; 
import StatsCard from './components/StatsCard';
import ControlPanel from './components/ControlPanel';
import FootprintMap, { FootprintMapHandle } from './components/FootprintMap';
import { Download } from 'lucide-react';

const App: React.FC = () => {
  const [visitedCities, setVisitedCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  
  const mapRef = useRef<FootprintMapHandle>(null);

  // Load state
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setVisitedCities(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved cities", e);
      }
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(visitedCities));
  }, [visitedCities]);

  const handleAddCity = useCallback(async (cityName: string) => {
    // Check duplication
    if (visitedCities.some(c => c.name === cityName)) {
       setErrorMsg(`City ${cityName} is already added!`);
       setTimeout(() => setErrorMsg(null), 3000);
       return;
    }

    setLoading(true);
    try {
      const cityData = await searchCityLocation(cityName);
      
      setVisitedCities(prev => {
         if (prev.find(p => p.name === cityData.name)) return prev;
         return [...prev, cityData];
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Location not found");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  }, [visitedCities]);

  const handleClear = useCallback(() => {
    if (window.confirm("Are you sure you want to clear your travel history?")) {
      setVisitedCities([]);
    }
  }, []);

  const handleDownload = () => {
    if (mapRef.current) {
      mapRef.current.downloadScreenshot();
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className={`relative w-full h-screen flex flex-col overflow-hidden font-sans transition-colors duration-500 ${THEME_CONFIG[theme].background}`}>
      
      {/* Toast Notification */}
      {errorMsg && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl animate-bounce">
          {errorMsg}
        </div>
      )}

      {/* Floating Stats */}
      <StatsCard visitedCities={visitedCities} />

      {/* Map Area */}
      <div className="flex-1 relative z-0 pb-72">
        <FootprintMap 
          ref={mapRef}
          visitedCities={visitedCities}
          onCityAdded={() => {}} 
          onError={(msg) => {
              setErrorMsg(msg);
              setTimeout(() => setErrorMsg(null), 4000);
          }}
          setLoading={setLoading}
          theme={theme}
        />
      </div>

      {/* Floating Download Button */}
      <button 
        onClick={handleDownload}
        className="fixed bottom-80 right-6 z-30 bg-white text-teal-600 px-4 py-3 rounded-full shadow-xl flex items-center justify-center space-x-2 hover:bg-teal-50 hover:scale-105 active:scale-95 transition-all group font-medium"
        title="Download Map Image"
      >
        <Download className="w-5 h-5 group-hover:animate-bounce" />
        <span>Save Map</span>
      </button>

      {/* Control Panel */}
      <ControlPanel 
        onAddCity={handleAddCity}
        onClear={handleClear}
        isLoading={loading}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
};

export default App;
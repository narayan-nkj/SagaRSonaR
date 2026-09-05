/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, ReactNode } from 'react';

type CoordFormat = 'DD' | 'DMS';

interface PreferencesContextType {
  coordFormat: CoordFormat;
  setCoordFormat: (format: CoordFormat) => void;
  formatCoordinates: (lat: number, lng: number, includeLabels?: boolean) => string;
  formatLat: (lat: number) => string;
  formatLng: (lng: number) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coordFormat, setCoordFormatState] = useState<CoordFormat>('DD');

  const setCoordFormat = (format: CoordFormat) => {
    setCoordFormatState(format);
  };

  const toDMS = (deg: number, isLat: boolean) => {
    const absolute = Math.abs(deg);
    const d = Math.floor(absolute);
    const m = Math.floor((absolute - d) * 60);
    const s = ((absolute - d - m / 60) * 3600).toFixed(1);
    const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
    return `${d}°${m}'${s}"${dir}`;
  };

  const formatLat = (lat: number) => {
    return coordFormat === 'DD' 
      ? `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
      : toDMS(lat, true);
  };

  const formatLng = (lng: number) => {
    return coordFormat === 'DD' 
      ? `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
      : toDMS(lng, false);
  };

  const formatCoordinates = (lat: number, lng: number, includeLabels = false) => {
    if (includeLabels) {
      return `LAT: ${formatLat(lat)} | LNG: ${formatLng(lng)}`;
    }
    return `${formatLat(lat)}, ${formatLng(lng)}`;
  };

  return (
    <PreferencesContext.Provider value={{ coordFormat, setCoordFormat, formatCoordinates, formatLat, formatLng }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

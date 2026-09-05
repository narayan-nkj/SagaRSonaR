import { createContext, useContext } from 'react';
import type { Anomaly } from '../data/mockData';

export const HarbourContext = createContext<{
  activeHarbour: string;
  setActiveHarbour: (harbour: string) => void;
}>({
  activeHarbour: 'Mumbai Harbor Q3',
  setActiveHarbour: () => {},
});

export const RealTimeAnomalyContext = createContext<Record<string, Partial<Anomaly>>>({});

export const useHarbour = () => useContext(HarbourContext);
export const useRealTimeAnomalies = () => useContext(RealTimeAnomalyContext);

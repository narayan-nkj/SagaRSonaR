import { useState, useEffect } from 'react';

export const useMapStyle = () => {
  const [mapStyle, setMapStyle] = useState<any>(null);

  useEffect(() => {
    async function fetchStyle() {
      try {
        const response = await fetch('https://tiles.openfreemap.org/styles/dark');
        const jsStyleObject = await response.json();

        setMapStyle(jsStyleObject);
      } catch (error) {
        console.error("Failed to load map style object:", error);
      }
    }

    fetchStyle();
  }, []);

  return mapStyle;
};

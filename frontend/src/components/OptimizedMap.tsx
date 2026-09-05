import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function OptimizedMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    let map: maplibregl.Map;

    async function initializeMap() {
      try {
        const response = await fetch('https://tiles.openfreemap.org/styles/dark');
        const styleJSON = await response.json();

        // 1. Pre-Load Mutations
        styleJSON.layers.forEach((layer: any) => {
          if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
            layer.layout['text-field'] = [
              'coalesce',
              ['get', 'name:en'],
              ['get', 'name']
            ];
          }

          if (layer.id.includes('state') || layer.id.includes('province')) {
            layer.minzoom = 4.5;
          }

          if (layer.id.includes('city') || layer.id.includes('town') || layer.id.includes('village')) {
            layer.minzoom = 6;
          }
        });

        // 2. Map Configuration
        map = new maplibregl.Map({
          container: mapContainer.current!,
          style: styleJSON,
          center: [72.8147, 18.9246], // Mumbai
          zoom: 11,
          minZoom: 2,
          maxZoom: 20,
          antialias: true,
          attributionControl: false,
          crossSourceCollisions: false,
          fadeDuration: 600,
        });

        // 3. UI Controls
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

        // 4. Smooth Loading
        map.once('idle', () => {
          map.resize();
          setIsLoaded(true);
        });

      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    }

    initializeMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  return (
    <div 
      className="w-full h-full absolute inset-0"
      style={{ backgroundColor: 'var(--theme-color-surface)' }}
    >
      <div
        ref={mapContainer}
        className={`w-full h-full absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: 'translateZ(0)' }}
      />
    </div>
  );
}

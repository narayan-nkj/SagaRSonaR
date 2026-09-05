import React, { useEffect, useState, forwardRef, createContext, useContext } from 'react';
import ReactMapGL, { Marker as GLMarker, Source as GLSource, Layer as GLLayer, MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '../contexts/ThemeContext';

let cachedDarkStyle: any = null;
let cachedLightStyle: any = null;

const MapContext = createContext<maplibregl.Map | null>(null);

export function useMap() {
  return useContext(MapContext);
}

export const Map = forwardRef(({ initialViewState, children, onIdle, interactive = true }: any, ref: React.ForwardedRef<MapRef>) => {
  const { theme } = useTheme();
  const [mapStyle, setMapStyle] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStyle() {
      let jsStyleObject;
      if (theme === 'dark' && cachedDarkStyle) {
        jsStyleObject = cachedDarkStyle;
      } else if (theme === 'light' && cachedLightStyle) {
        jsStyleObject = cachedLightStyle;
      } else {
        const styleUrl = theme === 'dark' ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/positron';
        try {
          const response = await fetch(styleUrl);
          jsStyleObject = await response.json();

          jsStyleObject.layers.forEach((layer: any) => {
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
          if (theme === 'dark') cachedDarkStyle = jsStyleObject;
          else cachedLightStyle = jsStyleObject;
        } catch (err) {
          console.error("Failed to load map style", err);
          return;
        }
      }
      if (isMounted) setMapStyle(jsStyleObject);
    }
    loadStyle();
    return () => {
      isMounted = false;
    };
  }, [theme]);

  return (
    <div 
      style={{ 
        width: '100%', height: '100%', position: 'absolute', inset: 0, 
        backgroundColor: theme === 'dark' ? '#0A0A0A' : '#F4F4F5',
        opacity: mapStyle ? 1 : 0,
        transition: 'opacity 0.8s ease-in-out'
      }}
    >
      {mapStyle && (
        <ReactMapGL
          ref={ref}
          mapLib={maplibregl as any}
          initialViewState={initialViewState}
          mapStyle={mapStyle}
          interactive={interactive}
          onIdle={onIdle}
          style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
          attributionControl={false}
          crossSourceCollisions={false}
          renderWorldCopies={true}
        >
          {children}
        </ReactMapGL>
      )}
    </div>
  );
});

export const Marker = GLMarker;
export const Source = GLSource;
export const Layer = GLLayer;

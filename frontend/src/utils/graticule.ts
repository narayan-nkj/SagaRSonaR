export const generateGraticule = (step: number = 0.05, formatLat?: (l: number) => string, formatLng?: (l: number) => string) => {
  const features = [];
  
  // Latitudes (Horizontal lines)
  for (let lat = -90; lat <= 90; lat += step) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] },
      properties: { label: formatLat ? formatLat(lat) : `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`, type: 'latitude' }
    });
  }

  // Longitudes (Vertical lines)
  for (let lng = -180; lng <= 180; lng += step) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[lng, -90], [lng, 90]] },
      properties: { label: formatLng ? formatLng(lng) : `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`, type: 'longitude' }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
};

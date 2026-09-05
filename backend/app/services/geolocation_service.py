from app.database.models import Mission, Detection
from app.utils.geo_utils import calculate_offset

class GeolocationService:
    def locate_detection(self, mission: Mission, detection: Detection, image_width: int, max_range: float = None):
        """
        Calculates geographical coordinates for a detection based on mission metadata
        and its pixel position in the sonar image.
        """
        # Default mock coordinates if mission metadata missing
        if not mission.latitude or not mission.longitude:
            return {
                "latitude": 18.42183 + (detection.bbox_x1 * 0.00001),
                "longitude": 72.81421 + (detection.bbox_y1 * 0.00001),
                "depth": mission.depth or 43.7,
                "range": 0,
                "location_source": "demo"
            }
            
        heading = mission.heading or 0.0
        sonar_range = mission.sonar_range or max_range or 100.0
        
        # Calculate offset based on bbox center x coordinate relative to center of image
        # Assuming port is left, starboard is right, center is the vessel track
        center_x = (detection.bbox_x1 + detection.bbox_x2) / 2
        
        # Calculate proportional distance from center (-1 to 1)
        rel_pos = (center_x - (image_width / 2)) / (image_width / 2)
        
        # Offset in meters (perpendicular to heading)
        offset_meters = rel_pos * sonar_range
        
        # Direction is heading +/- 90 degrees based on port/starboard
        direction = heading + 90 if offset_meters > 0 else heading - 90
        
        new_lat, new_lon = calculate_offset(
            lat=mission.latitude,
            lon=mission.longitude,
            heading_deg=direction,
            offset_meters=abs(offset_meters)
        )
        
        return {
            "latitude": new_lat,
            "longitude": new_lon,
            "depth": mission.depth,
            "range": abs(offset_meters),
            "location_source": "metadata"
        }

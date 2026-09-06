import json
import re
from app.database.models import Mission, Detection
from app.utils.geo_utils import calculate_offset

class GeolocationService:
    def extract_geolocation(self, metadata_str: str):
        default_lat, default_lon, default_depth = None, None, None
        try:
            if metadata_str.strip().startswith("{"):
                data = json.loads(metadata_str)
                default_lat = data.get("latitude")
                default_lon = data.get("longitude")
                default_depth = data.get("depth")
            else:
                match_gga = re.search(r'\$GPGGA,.*?,(\d+\.\d+),([NS]),(\d+\.\d+),([EW])', metadata_str)
                if match_gga:
                    default_lat = float(match_gga.group(1)) * (1 if match_gga.group(2) == 'N' else -1)
                    default_lon = float(match_gga.group(3)) * (1 if match_gga.group(4) == 'E' else -1)
                
                match_dpt = re.search(r'\$SDDBT,.*?,(\d+\.\d+),M', metadata_str)
                if match_dpt:
                    default_depth = float(match_dpt.group(1))
        except Exception:
            pass
        return default_lat, default_lon, default_depth

    def locate_detection(self, mission: Mission, detection: Detection, image_width: int, max_range: float = None, metadata_str: str = None):
        ext_lat, ext_lon, ext_depth = None, None, None
        if metadata_str:
            ext_lat, ext_lon, ext_depth = self.extract_geolocation(metadata_str)

        lat = ext_lat if ext_lat is not None else mission.latitude
        lon = ext_lon if ext_lon is not None else mission.longitude
        depth = ext_depth if ext_depth is not None else mission.depth
        
        if not lat or not lon:
            return {
                "latitude": 18.42183 + (detection.bbox_x1 * 0.00001),
                "longitude": 72.81421 + (detection.bbox_y1 * 0.00001),
                "depth": depth or 43.7,
                "range": 0,
                "location_source": "demo"
            }
            
        heading = mission.heading or 0.0
        sonar_range = mission.sonar_range or max_range or 100.0
        
        center_x = (detection.bbox_x1 + detection.bbox_x2) / 2
        rel_pos = (center_x - (image_width / 2)) / (image_width / 2)
        offset_meters = rel_pos * sonar_range
        
        direction = heading + 90 if offset_meters > 0 else heading - 90
        
        new_lat, new_lon = calculate_offset(
            lat=lat,
            lon=lon,
            heading_deg=direction,
            offset_meters=abs(offset_meters)
        )
        
        return {
            "latitude": new_lat,
            "longitude": new_lon,
            "depth": depth,
            "range": abs(offset_meters),
            "location_source": "metadata" if metadata_str else "mission"
        }

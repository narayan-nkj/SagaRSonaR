import math

def calculate_offset(lat: float, lon: float, heading_deg: float, offset_meters: float):
    """
    Simple mathematical model for offset along a heading.
    Returns (new_lat, new_lon)
    """
    # Earth's radius in meters
    R = 6378137
    
    # Convert latitude, longitude, and heading to radians
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    heading_rad = math.radians(heading_deg)
    
    # Calculate new latitude
    new_lat_rad = math.asin(
        math.sin(lat_rad) * math.cos(offset_meters / R) +
        math.cos(lat_rad) * math.sin(offset_meters / R) * math.cos(heading_rad)
    )
    
    # Calculate new longitude
    new_lon_rad = lon_rad + math.atan2(
        math.sin(heading_rad) * math.sin(offset_meters / R) * math.cos(lat_rad),
        math.cos(offset_meters / R) - math.sin(lat_rad) * math.sin(new_lat_rad)
    )
    
    return math.degrees(new_lat_rad), math.degrees(new_lon_rad)

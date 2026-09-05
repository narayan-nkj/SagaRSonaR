import cv2
import numpy as np

def generate_tiles(image_path: str, tile_size: int = 1024, overlap: int = 128):
    """
    Generates tiles from a large image given a tile size and overlap.
    Yields (tile_image, (x1, y1, x2, y2))
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")
        
    h, w = img.shape[:2]
    
    stride = tile_size - overlap
    
    for y in range(0, h, stride):
        for x in range(0, w, stride):
            y1, y2 = y, min(y + tile_size, h)
            x1, x2 = x, min(x + tile_size, w)
            
            # Extract tile
            tile = img[y1:y2, x1:x2]
            
            # Padding if tile is smaller than tile_size (optional depending on model needs, but we'll return raw for now)
            # if tile.shape[0] < tile_size or tile.shape[1] < tile_size:
            #     pad_h = tile_size - tile.shape[0]
            #     pad_w = tile_size - tile.shape[1]
            #     tile = cv2.copyMakeBorder(tile, 0, pad_h, 0, pad_w, cv2.BORDER_CONSTANT, value=(0,0,0))
                
            yield tile, (x1, y1, x2, y2)

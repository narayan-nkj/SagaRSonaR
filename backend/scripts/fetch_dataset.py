import os
import urllib.request
import zipfile
import shutil
import logging
import tempfile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fetch_dataset")

DATASET_URL = "https://github.com/MingqiangNing/SCTD/archive/refs/heads/master.zip"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
DEMO_DIR = os.path.join(DATA_DIR, "demo")

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    os.makedirs(DEMO_DIR, exist_ok=True)
    
    with tempfile.TemporaryDirectory() as tmpdirname:
        zip_path = os.path.join(tmpdirname, "SCTD.zip")
        logger.info(f"Downloading SCTD dataset from {DATASET_URL}...")
        
        try:
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            
            # We use a user-agent just in case github requires it
            req = urllib.request.Request(DATASET_URL, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx) as response, open(zip_path, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)
                
            logger.info("Download complete. Unzipping...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(tmpdirname)
            
            logger.info("Extracting 10 sample JPG images...")
            
            images_copied = 0
            # Look for JPGs recursively
            for root, dirs, files in os.walk(tmpdirname):
                for file in files:
                    if file.lower().endswith(('.jpg', '.jpeg')) and images_copied < 10:
                        src = os.path.join(root, file)
                        dst = os.path.join(DATA_DIR, file)
                        shutil.copy2(src, dst)
                        logger.info(f"Copied {file} to data directory.")
                        images_copied += 1
                        
            if images_copied == 0:
                logger.warning("No JPG images found in the dataset. Generating dummy sonar images as fallback...")
                import numpy as np
                import cv2
                for i in range(5):
                    # Generate a noisy grayscale image resembling sonar
                    img = np.random.randint(50, 150, (640, 640), dtype=np.uint8)
                    # Add some artifacts
                    cv2.circle(img, (320, 320), 50, (200,), -1)
                    dst = os.path.join(DATA_DIR, f"dummy_sonar_{i}.jpg")
                    cv2.imwrite(dst, img)
                    images_copied += 1
                logger.info(f"Successfully staged {images_copied} dummy images in {DATA_DIR}")
            else:
                logger.info(f"Successfully staged {images_copied} images in {DATA_DIR}")
                
        except Exception as e:
            logger.error(f"Failed to fetch dataset: {e}")

if __name__ == "__main__":
    main()

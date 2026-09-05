import json

with open("seed_anomalies.py", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "ANO-JN-" in line:
        # replace latitude and longitude to be near 18.94, 72.93
        import re
        import random
        lat = 18.94 + random.uniform(-0.01, 0.01)
        lng = 72.93 + random.uniform(-0.01, 0.01)
        line = re.sub(r'"latitude":\d+\.\d+', f'"latitude":{lat}', line)
        line = re.sub(r'"longitude":\d+\.\d+', f'"longitude":{lng}', line)
    new_lines.append(line)

with open("seed_anomalies.py", "w") as f:
    f.writelines(new_lines)

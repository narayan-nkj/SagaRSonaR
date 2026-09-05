import json
import re

transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"
app_tsx_content = None

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get('content', '')
            if isinstance(content, str):
                if '/Users/narayanjha/Documents/S.A.G.A.R - Command copy/src/App.tsx' in content and 'export default function AppShell()' in content:
                    app_tsx_content = content
        except:
            pass

print("LENGTH:", len(app_tsx_content) if app_tsx_content else 0)
if app_tsx_content:
    with open('found_app.txt', 'w') as f:
        f.write(app_tsx_content)

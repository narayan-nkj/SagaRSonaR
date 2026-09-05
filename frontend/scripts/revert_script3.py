import json
import re

transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Find the PLANNER_RESPONSE containing replace_file_content for App.tsx
            if data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    if tc['name'] in ('replace_file_content', 'multi_replace_file_content'):
                        if 'App.tsx' in tc['args'].get('TargetFile', ''):
                            print("Found modification of App.tsx")
                            print("TargetContent:", repr(tc['args'].get('TargetContent', ''))[:100])
        except Exception as e:
            pass

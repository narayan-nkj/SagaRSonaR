import json

transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"
app_tsx_target_content = None

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    if tc['name'] == 'replace_file_content':
                        if 'App.tsx' in tc['args'].get('TargetFile', ''):
                            tc_target = tc['args'].get('TargetContent', '')
                            # Is this the one I replaced? The original one?
                            if 'import React, { createContext' in tc_target:
                                with open('/Users/narayanjha/Documents/S.A.G.A.R - Command copy/src/App.tsx', 'w') as f2:
                                    f2.write(tc_target)
                                print("Wrote App.tsx with imports!")
                                exit(0)
        except Exception as e:
            pass

print("Could not find full App.tsx TargetContent with imports")

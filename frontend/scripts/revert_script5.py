import json

transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    if tc['name'] == 'replace_file_content':
                        if 'App.tsx' in tc['args'].get('TargetFile', ''):
                            tc_target = tc['args'].get('TargetContent', '')
                            if 'const AppShell: React.FC<{ children: React.ReactNode }>' in tc_target:
                                with open('/Users/narayanjha/Documents/S.A.G.A.R - Command copy/src/App.tsx', 'w') as f2:
                                    f2.write(tc_target)
                                print("Wrote App.tsx from TargetContent")
                                exit(0)
        except Exception as e:
            pass

print("Could not find full App.tsx TargetContent")

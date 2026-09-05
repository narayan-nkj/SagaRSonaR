import json

transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"
app_tsx_target_content = None

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    if tc['name'] in ('replace_file_content', 'multi_replace_file_content'):
                        if 'App.tsx' in tc['args'].get('TargetFile', ''):
                            tc_target = tc['args'].get('TargetContent', '')
                            if 'const AppShell: React.FC<{ children: React.ReactNode }>' in tc_target:
                                app_tsx_target_content = tc_target
                                break
                if app_tsx_target_content:
                    break
        except Exception as e:
            pass

print("App.tsx Target Content:")
print(app_tsx_target_content)

import json

transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"
app_tsx_view = None

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                for tc in data.get('tool_calls', []):
                    if tc['name'] == 'multi_replace_file_content' and 'App.tsx' in tc['args'].get('TargetFile', ''):
                        for chunk in tc['args'].get('ReplacementChunks', []):
                            print("TARGET CONTENT:", repr(chunk.get('TargetContent', ''))[:200])
        except Exception as e:
            pass

import json

transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"
app_tsx_content = None

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Find the view_file tool responses for App.tsx
            content = data.get('content', '')
            if isinstance(content, str) and 'File: /Users/narayanjha/Documents/S.A.G.A.R - Command copy/src/App.tsx' in content:
                # the very first view_file response!
                app_tsx_content = content
                break
        except Exception as e:
            pass

if app_tsx_content:
    lines = app_tsx_content.split('\n')
    # find where the file starts
    start_idx = 0
    for i, l in enumerate(lines):
        if l.startswith('import '):
            start_idx = i
            break
    code = '\n'.join(lines[start_idx:])
    with open('/Users/narayanjha/Documents/S.A.G.A.R - Command copy/src/App.tsx', 'w') as f:
        f.write(code)
    print("Reverted App.tsx to TRUE ORIGINAL from view_file")
else:
    print("Could not find App.tsx in view_file")

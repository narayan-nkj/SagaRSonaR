import json

transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"
app_tsx_content = None

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get('content', '')
            if isinstance(content, str):
                if '/Users/narayanjha/Documents/S.A.G.A.R - Command copy/src/App.tsx' in content and 'export default function AppShell()' in content and '<Sidebar />' in content:
                    app_tsx_content = content
        except:
            pass

def clean_view_file_output(output):
    lines = output.split('\n')
    for i, l in enumerate(lines):
        if l.startswith('import ') or l.startswith('export '):
            return '\n'.join(lines[i:])
    return output

if app_tsx_content:
    with open('/Users/narayanjha/Documents/S.A.G.A.R - Command copy/src/App.tsx', 'w') as f:
        f.write(clean_view_file_output(app_tsx_content))
    print("Reverted App.tsx")
else:
    print("Could not find App.tsx")


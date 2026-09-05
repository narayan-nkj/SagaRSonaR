import json

transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"
app_tsx_content = None
dashboard_tsx_content = None

with open(transcript_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Find the view_file tool responses
            content = data.get('content', '')
            if isinstance(content, str):
                if '/Users/narayanjha/Documents/S.A.G.A.R - Command copy/src/App.tsx' in content and 'export default function AppShell()' in content and 'className="flex h-screen overflow-hidden' in content:
                    app_tsx_content = content
                if '/Users/narayanjha/Documents/S.A.G.A.R - Command copy/src/pages/Dashboard.tsx' in content and 'export default function Dashboard()' in content and 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' in content:
                    dashboard_tsx_content = content
        except Exception as e:
            pass

def clean_view_file_output(output):
    # output looks like:
    # ...
    # File: /path
    # Size: ...
    # Lines: ...
    # 
    # import React...
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

if dashboard_tsx_content:
    with open('/Users/narayanjha/Documents/S.A.G.A.R - Command copy/src/pages/Dashboard.tsx', 'w') as f:
        f.write(clean_view_file_output(dashboard_tsx_content))
    print("Reverted Dashboard.tsx")
else:
    print("Could not find Dashboard.tsx")

import json
import os

transcript_paths = [
    "/Users/narayanjha/.gemini/antigravity-ide/brain/2b26ba7f-b5bc-4f6d-b227-bc5ff7e10d23/.system_generated/logs/transcript_full.jsonl",
    "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"
]

original_contents = {}

def scan_transcript(path):
    if not os.path.exists(path):
        return
    with open(path, 'r') as f:
        for line in f:
            try:
                data = json.loads(line)
                if 'tool_calls' in data and data['tool_calls']:
                    for call in data['tool_calls']:
                        if call.get('name') in ['multi_replace_file_content', 'replace_file_content']:
                            args = call.get('arguments', {})
                            target_file = args.get('TargetFile', '')
                            if not target_file:
                                continue
                                
                            filename = os.path.basename(target_file)
                            
                            # Only capture the FIRST time a file is modified across ALL transcripts
                            if filename not in original_contents:
                                if call.get('name') == 'replace_file_content':
                                    original_contents[filename] = args.get('TargetContent', '')
                                elif call.get('name') == 'multi_replace_file_content':
                                    chunks = args.get('ReplacementChunks', [])
                                    if len(chunks) == 1 and 'TargetContent' in chunks[0]:
                                        original_contents[filename] = chunks[0]['TargetContent']
            except Exception as e:
                pass

for path in transcript_paths:
    scan_transcript(path)

os.makedirs('/tmp/revert_backups', exist_ok=True)
for k, v in original_contents.items():
    if v:
        with open(f'/tmp/revert_backups/{k}', 'w') as f:
            f.write(v)
        print(f"Saved original for {k} to /tmp/revert_backups/")
    else:
        print(f"Empty or missing original for {k}")


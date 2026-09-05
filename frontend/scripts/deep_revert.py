import json
import os

# Transcript of the very first conversation today
transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/2b26ba7f-b5bc-4f6d-b227-bc5ff7e10d23/.system_generated/logs/transcript_full.jsonl"
current_transcript_path = "/Users/narayanjha/.gemini/antigravity-ide/brain/88bfc4f2-1a5d-4a85-82b8-83884559ba0d/.system_generated/logs/transcript_full.jsonl"

original_contents = {
    'index.css': None,
    'App.tsx': None,
    'Dashboard.tsx': None
}

# Function to parse a transcript and look for the FIRST target content
def scan_transcript(path):
    if not os.path.exists(path):
        return
    with open(path, 'r') as f:
        for line in f:
            try:
                data = json.loads(line)
                
                # Check for tool_calls
                if 'tool_calls' in data and data['tool_calls']:
                    for call in data['tool_calls']:
                        if call.get('name') in ['multi_replace_file_content', 'replace_file_content']:
                            args = call.get('arguments', {})
                            target_file = args.get('TargetFile', '')
                            
                            filename = os.path.basename(target_file)
                            
                            if filename in original_contents and original_contents[filename] is None:
                                if call.get('name') == 'replace_file_content':
                                    original_contents[filename] = args.get('TargetContent')
                                elif call.get('name') == 'multi_replace_file_content':
                                    # If it's a multi replace, we might only have chunks.
                                    # But wait, earlier I wrote a script that replaced the WHOLE file from target content?
                                    chunks = args.get('ReplacementChunks', [])
                                    if len(chunks) == 1 and 'TargetContent' in chunks[0]:
                                        original_contents[filename] = chunks[0]['TargetContent']
            except Exception as e:
                pass

scan_transcript(transcript_path)
scan_transcript(current_transcript_path)

# Let's print what we found
for k, v in original_contents.items():
    if v is not None:
        print(f"Found original for {k} (length {len(v)})")
    else:
        print(f"Missing original for {k}")


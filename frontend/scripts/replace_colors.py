import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Backgrounds
    content = content.replace('#02060D', '#06101E')
    # Specific map base replace
    content = content.replace('bg-[#06101E]" // map base', 'bg-[#030811]') # if we had a comment, but let's just use #06101E for map base too, it's very close. Actually let's manually do MapWorkspace if needed.
    
    # 2. Card Surfaces
    content = content.replace('#07111F', '#0F1C33')
    content = content.replace('#0D1B2A', '#0F1C33')
    
    # 3. Borders & Dividers
    content = content.replace('#12263A', '#1F3353')
    
    # 4. Primary Text
    content = content.replace('#E7F2F8', '#F9F6F0')
    content = content.replace('text-white', 'text-[#F9F6F0]')
    content = content.replace('border-white', 'border-[#F9F6F0]')
    
    # 5. Secondary Text
    content = content.replace('#8DA7B8', '#94A8C8')
    
    # 6. Critical & Warning Status
    content = content.replace('#FF6B6B', '#F43F5E')
    content = content.replace('#F4C95D', '#EAB308')
    
    # 7. Normal Status / Primary Actions
    # First, let's just replace all #48E0B2 with #10B981 (Normal Status)
    content = content.replace('#48E0B2', '#10B981')
    content = content.replace('rgba(72,224,178', 'rgba(16,185,129')
    
    # Then we fix the specific primary actions:
    # Sidebar active pill in App.tsx:
    if "App.tsx" in filepath:
        content = content.replace("text-[#10B981] bg-[#10B981]/10", "text-[#387CFF] bg-[#387CFF]/10")
        content = content.replace("border-[#10B981]", "border-[#387CFF]")
    
    # Upload button in UploadProcess.tsx:
    if "UploadProcess.tsx" in filepath:
        content = content.replace("bg-[#10B981]", "bg-[#387CFF]")
        content = content.replace("bg-[#10B981]/90", "bg-[#387CFF]/90")
        content = content.replace("text-[#10B981]", "text-[#387CFF]")
        content = content.replace("border-[#10B981]", "border-[#387CFF]")
        content = content.replace("rgba(16,185,129", "rgba(56,124,255")
        
    # Hover states generic fix: 
    # The user wanted hover states as #244585. 
    # Often we used hover:bg-[#12263A]/50. This is now hover:bg-[#1F3353]/50.
    # Let's replace hover:bg-[#1F3353] with hover:bg-[#244585].
    content = content.replace('hover:bg-[#1F3353]', 'hover:bg-[#244585]')
    
    # Map base for MapWorkspace
    if "MapWorkspace.tsx" in filepath:
        # The container has bg-[#02060D] which became bg-[#06101E]
        # Let's change the specific one for the map to #030811
        content = content.replace('bg-[#06101E]', 'bg-[#030811]', 1) # Just the first one which is the container

    # Input fields
    # Find bg-[#0F1C33] that are inside <input or <select and change to #0B1526
    # A bit hard with simple replace, let's do a regex
    content = re.sub(r'(<(?:input|select)[^>]*class(?:Name)?="[^"]*)bg-\[#0F1C33\]', r'\1bg-[#0B1526]', content)

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            replace_in_file(os.path.join(root, file))

print("Color replacement complete.")

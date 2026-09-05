import os

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. App Background
    content = content.replace('#06101E', '#020611')
    
    # 2. Card Surfaces
    content = content.replace('#0F1C33', '#0B1426')
    
    # 3. Borders & Dividers
    content = content.replace('#1F3353', '#1A2B4C')
    
    # 4. Primary Text
    content = content.replace('#F9F6F0', '#FDF8EC')
    
    # 5. Secondary Text
    content = content.replace('#94A8C8', '#8B9BB4')
    
    # 6. Primary Actions
    content = content.replace('#387CFF', '#1E6AFF')
    content = content.replace('rgba(56,124,255', 'rgba(30,106,255')
    
    # 7. Hover States
    content = content.replace('#244585', '#00D2FF')
    # Change opacity to /20 for this neon color so it acts like a glow instead of a solid block
    content = content.replace('hover:bg-[#00D2FF]/50', 'hover:bg-[#00D2FF]/20')
    
    # 8. Map Base
    content = content.replace('#030811', '#000000')
    
    # 9. Input Fields
    content = content.replace('#0B1526', '#050A14')
    
    # 10. Critical
    content = content.replace('#F43F5E', '#FF3366')
    
    # 11. Warning
    content = content.replace('#EAB308', '#FFB800')
    
    # 12. Safe/Normal
    content = content.replace('#10B981', '#00E676')
    content = content.replace('rgba(16,185,129', 'rgba(0,230,118')

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            replace_in_file(os.path.join(root, file))

print("Color replacement complete.")

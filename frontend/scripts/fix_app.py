with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace HumanReviewQueue import
content = content.replace("import HumanReviewQueue from './pages/HumanReviewQueue';", "import HumanReviewQueue from './pages/ReviewReport';")

# Remove ErrorBoundary wrapper
content = content.replace("<ErrorBoundary>", "")
content = content.replace("</ErrorBoundary>", "")
content = content.replace("import ErrorBoundary from './components/ErrorBoundary';", "")

# Replace AvatarBadge
content = content.replace("import AvatarBadge from './components/ui/AvatarBadge';", "")
content = content.replace("<AvatarBadge size=\"sm\" showStatus />", "<div className=\"w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center\"><User className=\"w-4 h-4 text-slate-300\" /></div>")
content = content.replace("<AvatarBadge size=\"md\" showStatus />", "<div className=\"w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center\"><User className=\"w-5 h-5 text-slate-300\" /></div>")

with open('src/App.tsx', 'w') as f:
    f.write(content)

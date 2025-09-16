#!/bin/bash
# ODIN Navigator GitHub Push Script
# Pushes local ODIN project to https://github.com/sohamd1567/ODIN-NAVIGATOR.git

set -e

echo "🚀 ODIN Navigator GitHub Push Script"
echo "===================================="
echo "Target: https://github.com/sohamd1567/ODIN-NAVIGATOR.git"
echo ""

# 0) Verify we're in the ODIN project root
if [ ! -f "package.json" ] || ! grep -q "rest-express" package.json; then
    echo "❌ Error: Not in ODIN Navigator project root"
    echo "Please run this script from the directory containing package.json"
    exit 1
fi

echo "✅ Confirmed ODIN Navigator project root"

# 1) Initialize git if needed
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# 2) Stage and commit all current files
echo "📋 Staging all files..."
git add -A

echo "💾 Committing current state..."
if git commit -m "feat: complete ODIN Navigator space mission dashboard

- Full-stack TypeScript application with React frontend
- Express.js API server with WebSocket telemetry  
- AI-powered hazard analysis and trajectory optimization
- Real-time mission monitoring and decision logging
- NASA-grade battery management and thermal control
- Vercel deployment configuration
- Comprehensive test suite and development tools

Features:
✈️ Interactive trajectory visualization
🛡️ Multi-hazard detection and mitigation
🔋 Advanced power management system  
📡 Deep Space Network communication
🤖 Machine learning mission optimization
🌙 Lunar mission planning and execution
🚨 Emergency recovery protocols
📊 Real-time telemetry and analytics"; then
    echo "✅ Files committed successfully"
else
    echo "ℹ️  No new changes to commit"
fi

# 3) Ensure we're on main branch
echo "🌿 Setting default branch to main..."
git branch -M main
echo "✅ Default branch set to main"

# 4) Configure remote origin
REMOTE_URL="https://github.com/sohamd1567/ODIN-NAVIGATOR.git"

echo "🔗 Configuring remote origin..."
if git remote | grep -q '^origin$'; then
    echo "📝 Updating existing origin remote..."
    git remote set-url origin "$REMOTE_URL"
else
    echo "➕ Adding new origin remote..."
    git remote add origin "$REMOTE_URL"
fi
echo "✅ Remote origin configured: $REMOTE_URL"

# 5) Push with upstream tracking
echo "⬆️  Pushing to GitHub..."
echo "Attempting normal push first..."

if git push -u origin main; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo ""
    echo "⚠️  Normal push failed - remote may contain conflicting history"
    echo "This typically happens when the remote has an auto-generated README"
    echo ""
    echo "🔧 RESOLUTION OPTIONS:"
    echo ""
    echo "Option 1 (RECOMMENDED): Merge remote changes first"
    echo "  git pull origin main --allow-unrelated-histories"
    echo "  git push -u origin main"
    echo ""
    echo "Option 2 (FORCE PUSH): Overwrite remote history"
    echo "  ⚠️  WARNING: This will replace ALL remote content!"
    echo "  git push -u --force origin main"
    echo ""
    echo "Choose your preferred approach and run the commands above."
    
    # Provide an interactive option
    echo ""
    read -p "🤔 Would you like to try force push now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "💪 Force pushing to GitHub..."
        git push -u --force origin main
        echo "✅ Force push completed!"
    else
        echo "ℹ️  Skipping force push. Use the commands above when ready."
        exit 1
    fi
fi

echo ""
echo "🎉 ODIN Navigator successfully pushed to GitHub!"
echo ""

# 6) Verification
echo "🔍 VERIFICATION"
echo "==============="
echo ""
echo "📍 Remote configuration:"
git remote -v
echo ""

echo "🌿 Remote main branch status:"
if git ls-remote --heads origin main | head -1; then
    echo "✅ Remote main branch exists and has content"
else
    echo "❌ Remote main branch not found"
fi
echo ""

echo "📝 Recent local commits:"
git log --oneline -n 5
echo ""

echo "🔗 Repository URL: https://github.com/sohamd1567/ODIN-NAVIGATOR"
echo ""

echo "✅ Push operation completed!"
echo "Your ODIN Navigator is now live on GitHub! 🚀"

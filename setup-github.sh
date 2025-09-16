#!/bin/bash
# Enhanced GitHub setup script for ODIN Navigator

echo "🔧 Enhanced GitHub Repository Setup"
echo "=================================="

# Check if we're authenticated with git
echo "🔍 Checking git authentication..."

# Try to test git credentials
if git ls-remote https://github.com/sohamd1567/ODIN-NAVIGATOR.git 2>/dev/null; then
    echo "✅ Repository exists and is accessible"
    REPO_EXISTS=true
else
    echo "❌ Repository not accessible. This could mean:"
    echo "   1. Repository doesn't exist yet"
    echo "   2. Wrong repository name/owner"
    echo "   3. Authentication required"
    REPO_EXISTS=false
fi

echo ""
echo "📋 Current repository suggestions:"
echo "1. https://github.com/sohamd1567/ODIN-NAVIGATOR.git (current target)"
echo "2. https://github.com/sohamd1567/odin-navigator.git (lowercase)"  
echo "3. https://github.com/sohamd1567/ODIN-Navigator.git (mixed case)"

echo ""
read -p "🤔 Which option would you like to try? (1/2/3/custom): " choice

case $choice in
    1)
        NEW_URL="https://github.com/sohamd1567/ODIN-NAVIGATOR.git"
        ;;
    2)
        NEW_URL="https://github.com/sohamd1567/odin-navigator.git"
        ;;
    3)
        NEW_URL="https://github.com/sohamd1567/ODIN-Navigator.git"
        ;;
    custom)
        read -p "Enter the full GitHub repository URL: " NEW_URL
        ;;
    *)
        echo "Using default: https://github.com/sohamd1567/ODIN-NAVIGATOR.git"
        NEW_URL="https://github.com/sohamd1567/ODIN-NAVIGATOR.git"
        ;;
esac

echo ""
echo "🔗 Setting remote to: $NEW_URL"
git remote set-url origin "$NEW_URL"

echo "✅ Remote updated:"
git remote -v

echo ""
echo "📋 Current git configuration:"
echo "User: $(git config user.name) <$(git config user.email)>"

echo ""
echo "⬆️  Attempting to push..."

# Try normal push first
if git push -u origin main; then
    echo "✅ Successfully pushed!"
    PUSH_SUCCESS=true
else
    echo "⚠️  Normal push failed. Trying with force push..."
    if git push -u --force origin main; then
        echo "✅ Force push successful!"
        PUSH_SUCCESS=true
    else
        echo "❌ Force push also failed."
        PUSH_SUCCESS=false
    fi
fi

if [ "$PUSH_SUCCESS" = true ]; then
    echo ""
    echo "🎉 ODIN Navigator successfully pushed!"
    echo "🌐 Repository URL: ${NEW_URL%%.git}"
    echo ""
    echo "🔍 Verification:"
    git remote -v
    echo ""
    echo "📝 Recent commits:"
    git log --oneline -n 3
else
    echo ""
    echo "❌ Push failed. Additional steps needed:"
    echo ""
    echo "1. 🏗️  Ensure repository exists on GitHub:"
    echo "   - Go to: https://github.com/new"
    echo "   - Repository name: ODIN-NAVIGATOR (or odin-navigator)"
    echo "   - Owner: sohamd1567"
    echo "   - Leave unchecked: Initialize with README"
    echo ""
    echo "2. 🔐 Check authentication:"
    echo "   - Personal Access Token: https://github.com/settings/tokens"
    echo "   - Or use SSH: git remote set-url origin git@github.com:sohamd1567/ODIN-NAVIGATOR.git"
    echo ""
    echo "3. 🔄 Try again:"
    echo "   ./setup-github.sh"
fi

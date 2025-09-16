#!/bin/bash
# ODIN Navigator GitHub Repository Setup Script
# Pushes existing ODIN project to https://github.com/sohamd1567/ODIN-NAVIGATOR.git

set -e

echo "🚀 ODIN Navigator GitHub Repository Setup"
echo "========================================"

# 0) Verify we're in the ODIN project root
if [[ ! -f "package.json" ]] || ! grep -q "rest-express" package.json; then
    echo "❌ Error: Not in ODIN Navigator project root"
    echo "Expected package.json with 'rest-express' name"
    exit 1
fi

echo "✅ Confirmed: In ODIN Navigator project root"

# 1) Initialize git repository if needed
if [ ! -d .git ]; then
    echo "📁 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# 2) Check current git status
echo "📊 Checking git status..."
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Uncommitted changes detected, adding all files..."
    git add -A
    if git commit -m "feat: prepare ODIN Navigator for GitHub deployment

- Complete ODIN space mission AI dashboard
- Vercel deployment configuration
- Comprehensive cleanup plan and safety checks
- All systems ready for production deployment"; then
        echo "✅ Changes committed successfully"
    else
        echo "ℹ️  No new changes to commit"
    fi
else
    echo "✅ Working directory is clean"
fi

# 3) Ensure we're on main branch
echo "🌿 Setting default branch to main..."
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    git checkout -b main 2>/dev/null || git checkout main
fi
git branch -M main
echo "✅ On main branch"

# 4) Configure remote origin
TARGET_URL="https://github.com/sohamd1567/ODIN-NAVIGATOR.git"
echo "🔗 Configuring remote origin..."

if git remote | grep -q '^origin$'; then
    CURRENT_URL=$(git remote get-url origin)
    echo "📍 Current origin: $CURRENT_URL"
    if [[ "$CURRENT_URL" != "$TARGET_URL" ]]; then
        echo "🔄 Updating remote URL..."
        git remote set-url origin "$TARGET_URL"
        echo "✅ Remote URL updated"
    else
        echo "✅ Remote URL already correct"
    fi
else
    echo "➕ Adding remote origin..."
    git remote add origin "$TARGET_URL"
    echo "✅ Remote origin added"
fi

# 5) Check if remote repository exists and has content
echo "🔍 Checking remote repository status..."
if git ls-remote --heads origin main >/dev/null 2>&1; then
    echo "📡 Remote main branch exists"
    
    # Try normal push first
    echo "⬆️  Attempting normal push..."
    if git push -u origin main 2>/dev/null; then
        echo "✅ Push successful!"
    else
        echo "⚠️  Normal push failed - likely due to divergent histories"
        echo ""
        echo "🤔 The remote repository may contain files (like README.md) that conflict"
        echo "    with your local history. You have two options:"
        echo ""
        echo "Option 1 (RECOMMENDED): Merge remote changes first"
        echo "  git pull origin main --allow-unrelated-histories"
        echo "  # Resolve any conflicts, then:"
        echo "  git push -u origin main"
        echo ""
        echo "Option 2 (DESTRUCTIVE): Force push (overwrites remote history)"
        echo "  git push -u -f origin main"
        echo ""
        echo "❗ WARNING: Option 2 will permanently delete any existing files in the remote repository!"
        echo ""
        echo "Would you like to try Option 1 automatically? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo "🔀 Attempting to merge remote changes..."
            if git pull origin main --allow-unrelated-histories; then
                echo "✅ Merge successful, pushing..."
                git push -u origin main
                echo "✅ Push completed successfully!"
            else
                echo "❌ Merge failed. Please resolve conflicts manually and try again."
                exit 1
            fi
        else
            echo "⏸️  Push cancelled. Please choose an option above and run manually."
            exit 1
        fi
    fi
else
    echo "📡 Remote main branch doesn't exist - this will be the first push"
    echo "⬆️  Pushing to remote repository..."
    git push -u origin main
    echo "✅ Initial push successful!"
fi

# 6) Verification
echo ""
echo "🎉 Repository setup completed successfully!"
echo "=========================================="
echo ""
echo "📍 Remote configuration:"
git remote -v
echo ""
echo "🌿 Remote branches:"
git ls-remote --heads origin
echo ""
echo "📝 Recent local commits:"
git log --oneline -n 5
echo ""
echo "🔗 Repository URL: $TARGET_URL"
echo "✅ Your ODIN Navigator is now available on GitHub!"
echo ""
echo "Next steps:"
echo "1. Visit $TARGET_URL to view your repository"
echo "2. Configure branch protection rules if desired"
echo "3. Set up Vercel deployment using this new repository"
echo "4. Update any local clone URLs to point to the new repository"

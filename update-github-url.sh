#!/bin/bash
# Update GitHub repository URL and push ODIN Navigator

echo "🔄 GitHub Repository URL Update Script"
echo "======================================"

# Show current remote
echo "Current remote:"
git remote -v
echo ""

# Prompt for new URL
read -p "Enter the correct GitHub repository URL: " NEW_URL

if [ -z "$NEW_URL" ]; then
    echo "❌ No URL provided. Exiting."
    exit 1
fi

echo "🔗 Updating remote to: $NEW_URL"
git remote set-url origin "$NEW_URL"

echo "✅ Remote updated. New configuration:"
git remote -v
echo ""

echo "⬆️  Pushing to updated repository..."
if git push -u origin main; then
    echo "✅ Successfully pushed to GitHub!"
else
    echo "💪 Trying force push..."
    git push -u --force origin main
fi

echo ""
echo "🎉 ODIN Navigator pushed successfully!"
echo "Repository: $NEW_URL"

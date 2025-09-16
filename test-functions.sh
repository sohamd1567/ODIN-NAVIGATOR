#!/bin/bash

echo "🧪 Testing Netlify Functions"
echo "=============================="

# Test health function
echo ""
echo "Testing /api/health..."
curl -i "http://localhost:8888/api/health" 2>/dev/null || echo "❌ Health endpoint failed"

echo ""
echo ""
echo "Testing /.netlify/functions/health..."
curl -i "http://localhost:8888/.netlify/functions/health" 2>/dev/null || echo "❌ Direct function endpoint failed"

echo ""
echo ""
echo "Testing /api/space-moon..."
curl -i "http://localhost:8888/api/space-moon?date=2025-09-16&lat=28.5&lon=-80.6" 2>/dev/null || echo "❌ Space-moon endpoint failed"

echo ""
echo ""
echo "✅ Test complete!"

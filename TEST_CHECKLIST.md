# 🧪 Netlify Functions Test Checklist

## ✅ Production Endpoints

### Health Check
```bash
curl -s "https://odin-navigator-space-dashboard.netlify.app/api/health" | jq .
```
**Expected Response:**
```json
{
  "ok": true,
  "ts": "2025-09-16T16:49:55.164Z",
  "service": "ODIN Navigator Health Check",
  "status": "operational"
}
```

### Space Moon Data
```bash
curl -s "https://odin-navigator-space-dashboard.netlify.app/api/space-moon?date=2025-09-16&lat=28.5&lon=-80.6" | jq .
```
**Expected Response:**
```json
{
  "date": "2025-09-16",
  "phase": "Waxing Gibbous",
  "illumination": 0.75,
  "distance_km": 384400
}
```

## 🔧 Local Development Testing

### Setup Netlify Dev
```bash
npx netlify dev
```

### Test Local Endpoints
```bash
# Health check
curl -i "http://localhost:8888/api/health"

# Moon data
curl -i "http://localhost:8888/api/space-moon?date=2025-09-16&lat=28.5&lon=-80.6"

# Direct function access
curl -i "http://localhost:8888/.netlify/functions/health"
```

## 🎯 UI Integration Tests

1. **Open ODIN Navigator**: https://odin-navigator-space-dashboard.netlify.app
2. **Check Moon Summary Panel**: Should show phase data, not HTML errors
3. **Check Notifications**: Should not contain DOCTYPE or HTML content
4. **Test SPA Routing**: Hard refresh on any route should work
5. **Verify API Calls**: Network tab should show JSON responses

## ⚡ Performance & Caching

- **Function Cold Start**: First API call may take 1-2 seconds
- **Subsequent Calls**: Should be fast (cached responses)
- **CORS Headers**: All endpoints include proper CORS headers
- **Content-Type**: All responses are `application/json`

## 🛡️ Error Handling Verification

### Test Invalid Endpoints
```bash
curl -i "https://odin-navigator-space-dashboard.netlify.app/api/nonexistent"
```
Should return 404 with proper JSON error, not HTML.

### Test Content-Type Guards
- API errors should show clear messages in UI
- HTML responses converted to readable error messages
- No raw DOCTYPE content in notifications

## 📝 Implementation Notes

- **Functions**: Lightweight, serverless endpoints
- **Caching**: 15-minute TTL for moon data
- **Mock Data**: Fallback when API keys missing
- **Bundle Size**: Functions are minimal and fast
- **CORS**: Enabled for cross-origin requests

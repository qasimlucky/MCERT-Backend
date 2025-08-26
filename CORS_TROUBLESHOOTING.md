# CORS Troubleshooting Guide

## Common CORS Issues and Solutions

### 1. CORS Configuration Fixed

The main CORS configuration has been updated in `src/main.ts` to resolve common issues:

- ✅ **Fixed wildcard origin with credentials**: Changed from `origin: "*"` to specific allowed origins
- ✅ **Added proper preflight handling**: Configured OPTIONS requests properly
- ✅ **Enhanced error logging**: Better debugging information for CORS issues
- ✅ **Environment variable support**: Can configure origins via `ALLOWED_ORIGINS` env var

### 2. Current Allowed Origins

```typescript
[
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'https://sirisreports.co.uk', 
  'https://sirisreports.xyz',
  'https://mcert-frontend.vercel.app'
]
```

### 3. Environment Configuration

Create a `.env` file in your project root:

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,https://sirisreports.co.uk,https://sirisreports.xyz,https://mcert-frontend.vercel.app
```

### 4. Testing CORS

After starting your server, test CORS with:

```bash
# Test from allowed origin
curl -H "Origin: http://localhost:3001" http://localhost:3000/cors-test

# Test CORS endpoint
curl http://localhost:3000/cors-test
```

### 5. Common CORS Error Messages

#### "Origin not allowed by CORS policy"
- **Solution**: Add your frontend URL to `allowedOrigins` array
- **Check**: Server logs will show which origin was blocked

#### "Credentials not supported with wildcard origin"
- **Solution**: ✅ **FIXED** - Now uses specific origins instead of wildcard

#### "Preflight request failed"
- **Solution**: ✅ **FIXED** - OPTIONS requests are now properly handled

### 6. Frontend Configuration

Ensure your frontend includes credentials in requests:

```javascript
// Fetch API
fetch('http://localhost:3000/api/endpoint', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Axios
axios.defaults.withCredentials = true;
```

### 7. Browser Developer Tools

Check the **Network** tab in browser dev tools:
- Look for failed requests (red)
- Check **Response Headers** for CORS headers
- Verify **Request Headers** include proper Origin

### 8. Server Logs

The server now provides detailed CORS logging:
- ✅ Allowed origins
- ✅ Blocked origins with reasons
- ✅ CORS configuration summary

### 9. Restart Required

After making CORS changes:
1. Stop the server (`Ctrl+C`)
2. Restart: `npm run start:dev`
3. Check console logs for CORS configuration

### 10. Still Having Issues?

If CORS errors persist:

1. **Check server logs** for specific error messages
2. **Verify frontend URL** is in allowed origins
3. **Clear browser cache** and cookies
4. **Test with Postman** to isolate frontend vs backend issues
5. **Check for proxy/load balancer** CORS interference

### 11. Quick Test Commands

```bash
# Test server is running
curl http://localhost:3000

# Test CORS endpoint
curl http://localhost:3000/cors-test

# Test with specific origin
curl -H "Origin: http://localhost:3001" -v http://localhost:3000/cors-test
```

The CORS configuration should now work properly for your development and production environments!

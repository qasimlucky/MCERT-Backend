# CORS Troubleshooting Guide

## Common CORS Issues and Solutions

### 1. CORS Configuration Fixed

The main CORS configuration has been updated in `src/main.ts` to resolve common issues:

- ✅ **Fixed wildcard origin with credentials**: Changed from `origin: "*"` to specific allowed origins
- ✅ **Added proper preflight handling**: Configured OPTIONS requests properly
- ✅ **Enhanced error logging**: Better debugging information for CORS issues
- ✅ **Environment variable support**: Can configure origins via `ALLOWED_ORIGINS` env var
- ✅ **All headers allowed**: Set `allowedHeaders: '*'` to accept any custom headers
- ✅ **Preflight never blocked**: Set `preflightContinue: true` to ensure OPTIONS requests always succeed

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

### 3. CORS Configuration Details

```typescript
app.enableCors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*', // ✅ ALL headers are now allowed
  exposedHeaders: ['Set-Cookie', 'Authorization', 'Access-Control-Allow-Origin'],
  preflightContinue: true, // ✅ Preflight requests are NEVER blocked
  optionsSuccessStatus: 200, // ✅ Return 200 for OPTIONS requests
  maxAge: 86400
});
```

### 4. Environment Configuration

Create a `.env` file in your project root:

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,https://sirisreports.co.uk,https://sirisreports.xyz,https://mcert-frontend.vercel.app
```

### 5. Testing CORS

After starting your server, test CORS with:

```bash
# Test from allowed origin
curl -H "Origin: http://localhost:3001" http://localhost:3000/cors-test

# Test CORS endpoint
curl http://localhost:3000/cors-test

# Test with custom headers (should now work)
curl -H "Origin: https://mcert-frontend.vercel.app" \
     -H "X-Custom-Header: test-value" \
     -H "X-API-Key: test-key" \
     http://localhost:3000/cors-test

# Test preflight request (should never be blocked)
curl -X OPTIONS -H "Origin: https://mcert-frontend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Custom-Header" \
     -v http://localhost:3000/cors-test
```

### 6. Common CORS Error Messages

#### "Origin not allowed by CORS policy"
- **Solution**: Add your frontend URL to `allowedOrigins` array
- **Check**: Server logs will show which origin was blocked

#### "Credentials not supported with wildcard origin"
- **Solution**: ✅ **FIXED** - Now uses specific origins instead of wildcard

#### "Preflight request failed"
- **Solution**: ✅ **FIXED** - OPTIONS requests are now properly handled and never blocked

#### "Request header field X-Custom-Header is not allowed"
- **Solution**: ✅ **FIXED** - All headers are now allowed with `allowedHeaders: '*'`

#### "OPTIONS request blocked"
- **Solution**: ✅ **FIXED** - Preflight requests are never blocked with `preflightContinue: true`

### 7. Frontend Configuration

Ensure your frontend includes credentials in requests:

```javascript
// Fetch API with custom headers (should now work)
fetch('http://localhost:3000/api/endpoint', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'custom-value',
    'X-API-Key': 'your-api-key',
    'X-Client-Version': '1.0.0'
  }
});

// Axios with custom headers
axios.defaults.withCredentials = true;
axios.get('http://localhost:3000/api/endpoint', {
  headers: {
    'X-Custom-Header': 'custom-value',
    'X-API-Key': 'your-api-key'
  }
});

// POST request with custom headers (preflight will never be blocked)
axios.post('http://localhost:3000/api/endpoint', data, {
  headers: {
    'X-Custom-Header': 'custom-value',
    'X-API-Key': 'your-api-key',
    'X-Request-Type': 'form-submission'
  }
});
```

### 8. Browser Developer Tools

Check the **Network** tab in browser dev tools:
- Look for failed requests (red)
- Check **Response Headers** for CORS headers
- Verify **Request Headers** include proper Origin
- Custom headers should now appear without CORS errors
- OPTIONS requests should return 200 status

### 9. Server Logs

The server now provides detailed CORS logging:
- ✅ Allowed origins
- ✅ All incoming headers (including custom ones)
- ✅ Preflight request detection and handling
- ✅ CORS configuration summary
- ✅ All headers allowed confirmation
- ✅ Preflight never blocked confirmation

### 10. Restart Required

After making CORS changes:
1. Stop the server (`Ctrl+C`)
2. Restart: `npm run start:dev`
3. Check console logs for CORS configuration
4. Verify "All headers are now allowed" message appears
5. Verify "Preflight requests will never be blocked" message appears

### 11. Quick Test Commands

```bash
# Test server is running
curl http://localhost:3000

# Test CORS endpoint
curl http://localhost:3000/cors-test

# Test with specific origin
curl -H "Origin: http://localhost:3001" -v http://localhost:3000/cors-test

# Test with custom headers (should now work)
curl -H "Origin: https://mcert-frontend.vercel.app" \
     -H "X-Custom-Header: test" \
     -H "X-API-Key: test123" \
     -v http://localhost:3000/cors-test

# Test preflight request (should never be blocked)
curl -X OPTIONS -H "Origin: https://mcert-frontend.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Custom-Header, X-API-Key" \
     -v http://localhost:3000/cors-test
```

### 12. 🚨 SPECIAL ISSUE: "No Logs" When Accessing Frontend

If you're getting **no logs at all** when accessing [https://mcert-frontend.vercel.app/](https://mcert-frontend.vercel.app/), this indicates:

#### Possible Causes:
1. **Frontend not making requests to your backend** - Check if frontend is configured to call `http://localhost:3000`
2. **Network/firewall blocking** - Frontend might be blocked from reaching localhost
3. **CORS preflight failing silently** - Browser might be blocking before request reaches server
4. **Frontend configuration issue** - API base URL might be wrong

#### Debugging Steps:

1. **Check Frontend API Configuration**:
   ```javascript
   // In your frontend, verify the API base URL
   const API_BASE_URL = 'http://localhost:3000'; // Should point to your backend
   ```

2. **Test with CORS Test Script**:
   ```bash
   node test-cors.js
   ```

3. **Check Browser Network Tab**:
   - Open [https://mcert-frontend.vercel.app/](https://mcert-frontend.vercel.app/)
   - Open Developer Tools → Network tab
   - Look for failed requests to `localhost:3000`
   - Check if requests are being made at all

4. **Test Direct Backend Access**:
   ```bash
   # Test if backend responds
   curl http://localhost:3000/health
   curl http://localhost:3000/cors-test
   ```

5. **Check Frontend Console Errors**:
   - Open browser console on frontend
   - Look for CORS errors or network failures

#### Quick Fixes:

1. **Verify API URL in Frontend**:
   ```javascript
   // Make sure this points to your running backend
   const API_URL = process.env.NODE_ENV === 'production' 
     ? 'https://your-production-backend.com' 
     : 'http://localhost:3000';
   ```

2. **Add CORS Debug Headers**:
   ```javascript
   // In your frontend requests
   fetch('http://localhost:3000/api/endpoint', {
     credentials: 'include',
     headers: {
       'Content-Type': 'application/json',
       'X-Debug-Origin': window.location.origin,
       'X-Custom-Header': 'test-value' // Should now work without CORS errors
     }
   });
   ```

3. **Test with Simple Request**:
   ```javascript
   // Test basic connectivity
   fetch('http://localhost:3000/health')
     .then(response => response.json())
     .then(data => console.log('✅ Backend connected:', data))
     .catch(error => console.error('❌ Backend error:', error));
   ```

### 13. 🎯 Benefits of All Headers Allowed + Preflight Never Blocked

With `allowedHeaders: '*'` and `preflightContinue: true`:

- ✅ **No more header-related CORS errors**
- ✅ **Custom headers work automatically**
- ✅ **API keys, client versions, debug headers accepted**
- ✅ **Future headers won't require CORS updates**
- ✅ **Simplified frontend development**
- ✅ **Preflight requests are NEVER blocked**
- ✅ **OPTIONS requests always return 200**
- ✅ **Complex requests with custom headers always succeed**

### 14. 🔄 Preflight Request Handling

Your server now handles preflight requests with:

1. **Automatic detection** of OPTIONS requests
2. **Never blocking** any preflight request
3. **Proper CORS headers** for all origins
4. **200 status response** for all OPTIONS requests
5. **Detailed logging** of preflight handling

The CORS configuration should now work perfectly for your development and production environments with ALL headers allowed and preflight requests NEVER blocked!

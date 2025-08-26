import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  
  // Add cookie-parser middleware
  app.use(cookieParser());
  
  // CORS configuration - simplified for better debugging
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:3002',
        'https://sirisreports.co.uk', 
        'https://sirisreports.xyz',
        'https://mcert-frontend.vercel.app',
      ];

  console.log('🚀 Starting server with CORS configuration...');
  console.log('🔒 Allowed CORS origins:', allowedOrigins);
  
  // Enable CORS with simple array-based origin and all headers allowed
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: '*', // Allow all headers
    exposedHeaders: ['Set-Cookie', 'Authorization', 'Access-Control-Allow-Origin'],
    preflightContinue: true, // Don't block preflight requests
    optionsSuccessStatus: 200, // Return 200 for OPTIONS requests
    maxAge: 86400 // Cache preflight response for 24 hours
  });

  // Add request logging middleware to see all incoming requests
  app.use((req: any, res: any, next: any) => {
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log(`🌐 Origin: ${req.headers.origin || 'No origin'}`);
    console.log(`🔑 User-Agent: ${req.headers['user-agent'] || 'No user-agent'}`);
    console.log(`📋 All Headers:`, req.headers);
    
    // Handle preflight requests explicitly
    if (req.method === 'OPTIONS') {
      console.log(`🔄 Preflight request detected for: ${req.url}`);
      console.log(`📋 Preflight headers:`, req.headers);
      
      // Set CORS headers for preflight
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      
      // Send 200 response for preflight
      res.status(200).end();
      return;
    }
    
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🔒 CORS enabled with ${allowedOrigins.length} allowed origins`);
  console.log(`📝 To test CORS, visit: http://localhost:${port}/cors-test`);
  console.log(`🌍 Frontend URL: https://mcert-frontend.vercel.app/`);
  console.log(`💡 Make sure your frontend is making requests to: http://localhost:${port}`);
  console.log(`🔓 All headers are now allowed in CORS configuration`);
  console.log(`✅ Preflight requests will never be blocked`);
}
bootstrap();

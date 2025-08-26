import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  
  // Add cookie-parser middleware
  app.use(cookieParser());
  
  // CORS configuration - COMPLETELY PERMISSIVE
  console.log('🚀 Starting server with COMPLETELY PERMISSIVE CORS configuration...');
  console.log('🔓 ALL origins, ALL headers, ALL methods allowed');
  
  // Enable CORS with WILDCARD for everything
  app.enableCors({
    origin: true, // Allow ALL origins
    credentials: true,
    methods: '*', // Allow ALL methods
    allowedHeaders: '*', // Allow ALL headers
    exposedHeaders: '*', // Expose ALL headers
    preflightContinue: true, // Preflight requests are NEVER blocked
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
      
      // Set CORS headers for preflight - ALLOW EVERYTHING
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', '*');
      res.header('Access-Control-Allow-Headers', '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      res.header('Access-Control-Expose-Headers', '*');
      
      // Send 200 response for preflight
      res.status(200).end();
      return;
    }
    
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🔓 CORS is COMPLETELY PERMISSIVE - ALL origins, headers, methods allowed`);
  console.log(`📝 To test CORS, visit: http://localhost:${port}/cors-test`);
  console.log(`🌍 Frontend URL: https://mcert-frontend.vercel.app/`);
  console.log(`💡 Make sure your frontend is making requests to: http://localhost:${port}`);
  console.log(`✅ Preflight requests will never be blocked`);
  console.log(`🌐 ALL origins are allowed`);
  console.log(`📋 ALL headers are allowed`);
  console.log(`🔄 ALL methods are allowed`);
}
bootstrap();

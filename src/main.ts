import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  console.log('🚀 Starting NestJS application...');
  console.log('📦 Loading modules and dependencies...');
  
  const app = await NestFactory.create(AppModule);
  console.log('✅ NestJS application created successfully');
  
  app.useGlobalPipes(new ValidationPipe());
  console.log('✅ Global validation pipe enabled');
  
  // Add cookie-parser middleware
  app.use(cookieParser());
  console.log('✅ Cookie parser middleware enabled');
  
  // CORS configuration - COMPLETELY PERMISSIVE
  console.log('🔓 Configuring CORS - COMPLETELY PERMISSIVE...');
  console.log('🌐 ALL origins allowed');
  console.log('📋 ALL headers allowed');
  console.log('🔄 ALL methods allowed');
  console.log('✅ Preflight requests never blocked');
  
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
  console.log('✅ CORS enabled with completely permissive configuration');

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
  console.log('✅ Request logging middleware enabled');

  const port = process.env.PORT || 3000;
  console.log(`🌍 Starting server on port: ${port}`);
  
  await app.listen(port);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SERVER STARTED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🔓 CORS is COMPLETELY PERMISSIVE - ALL origins, headers, methods allowed`);
  console.log(`📝 To test CORS, visit: http://localhost:${port}/public-cors-test`);
  console.log(`🌍 Frontend URL: https://mcert-frontend.vercel.app/`);
  console.log(`💡 Make sure your frontend is making requests to: http://localhost:${port}`);
  console.log(`✅ Preflight requests will never be blocked`);
  console.log(`🌐 ALL origins are allowed`);
  console.log(`📋 ALL headers are allowed`);
  console.log(`🔄 ALL methods are allowed`);
  console.log(`🍪 Cookie parser enabled`);
  console.log(`🔍 Request logging enabled`);
  console.log(`⏰ Server started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log('🎯 Ready to handle requests with COMPLETELY PERMISSIVE CORS!');
  console.log('='.repeat(60));
}
bootstrap();

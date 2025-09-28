import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';

async function bootstrap() {
  console.log('🚀 Starting NestJS application...');
  console.log('📦 Loading modules and dependencies...');

  const app = await NestFactory.create(AppModule, {
    bodyParser: true, // Enable default body parser
  });
  console.log(
    '✅ NestJS application created successfully with custom body parser configuration',
  );

  // Configure body size limits for large payloads
  console.log('📦 Configuring body parser limits for large payloads...');
  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ limit: '500mb', extended: true }));
  console.log('✅ Body size limits configured: 500MB for JSON and URL-encoded payloads');

  // Set server timeout for large file operations
  app.use((req: any, res: any, next: any) => {
    req.setTimeout(300000); // 5 minutes timeout for requests
    res.setTimeout(300000); // 5 minutes timeout for responses
    next();
  });
  console.log(
    '⏰ Server timeouts configured: 5 minutes for large file operations',
  );

  // Temporarily disable validation pipe to debug body parsing issue
  // app.useGlobalPipes(new ValidationPipe({
  //   transform: true,
  //   whitelist: true,
  //   forbidNonWhitelisted: false,
  // }));
  console.log('⚠️ Global validation pipe temporarily disabled - body parsing issue');

  // Add cookie-parser middleware
  app.use(cookieParser());
  console.log('✅ Cookie parser middleware enabled');

  // CORS configuration - COMPLETELY PERMISSIVE + Ngrok support
  console.log('🔓 Configuring CORS - COMPLETELY PERMISSIVE + Ngrok support...');
  console.log('🌐 ALL origins allowed (including ngrok)');
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
    preflightContinue: false, // Let NestJS handle preflight completely
    optionsSuccessStatus: 200, // Return 200 for OPTIONS requests
  });
  console.log('✅ CORS enabled with completely permissive configuration');

  // Add request logging middleware to see all incoming requests
  app.use((req: any, res: any, next: any) => {
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log(`🌐 Origin: ${req.headers.origin || 'No origin'}`);
    console.log(
      `🔑 User-Agent: ${req.headers['user-agent'] || 'No user-agent'}`,
    );
    console.log(`📋 All Headers:`, req.headers);

    // Set CORS headers for ALL requests (including ngrok) - EXACTLY THE SAME
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    );
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', '*');
    res.header('Access-Control-Max-Age', '86400');

    // Handle preflight requests explicitly with EXACTLY THE SAME headers
    if (req.method === 'OPTIONS') {
      console.log(`🔄 Preflight request detected for: ${req.url}`);
      console.log(`📋 Preflight headers:`, req.headers);

      // Send 200 response for preflight with EXACTLY THE SAME CORS headers
      res.status(200).end();
      return;
    }

    next();
  });
  console.log(
    '✅ Request logging middleware enabled with CORS headers for all requests',
  );

  const port = process.env.PORT || 3000;
  console.log(`🌍 Starting server on port: ${port}`);

  await app.listen(port);

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SERVER STARTED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `🔓 CORS is COMPLETELY PERMISSIVE - ALL origins, headers, methods allowed`,
  );
  console.log(
    `📝 To test CORS, visit: http://localhost:${port}/public-cors-test`,
  );
  console.log(`🌍 Frontend URL: https://mcert-frontend.vercel.app/`);
  console.log(
    `💡 Make sure your frontend is making requests to: http://localhost:${port}`,
  );
  console.log(`✅ Preflight requests will never be blocked`);
  console.log(`🌐 ALL origins are allowed (including ngrok)`);
  console.log(`📋 ALL headers are allowed`);
  console.log(`🔄 ALL methods are allowed`);
  console.log(`🍪 Cookie parser enabled`);
  console.log(`🔍 Request logging enabled with CORS headers`);
  console.log(`📦 Body size limits: 500MB for all payload types`);
  console.log(`⏰ Request/Response timeouts: 5 minutes for large operations`);
  console.log(`🔧 GridFS optimized for files > 25MB (direct chunk retrieval)`);
  console.log(`⏰ Server started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log(
    '🎯 Ready to handle LARGE PAYLOADS with COMPLETELY PERMISSIVE CORS + Ngrok support!',
  );
  console.log('='.repeat(60));
}
bootstrap();

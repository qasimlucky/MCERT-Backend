import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  
  // Add cookie-parser middleware
  app.use(cookieParser());
  
  // CORS configuration
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

  console.log('🚀 Allowed CORS origins:', allowedOrigins);
  
  const corsOptions = {
    origin: function (origin: string, callback: Function) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('✅ CORS: Allowing request with no origin');
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log(`✅ CORS: Allowing origin: ${origin}`);
        callback(null, true);
      } else {
        console.log(`❌ CORS: Blocking origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Access-Control-Allow-Origin'
    ],
    exposedHeaders: ['Set-Cookie', 'Authorization', 'Access-Control-Allow-Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // Cache preflight response for 24 hours
  };
  
  app.enableCors(corsOptions);

  // Add global exception filter for CORS errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err.message && err.message.includes('CORS')) {
      console.error('🚫 CORS Error:', err.message);
      res.status(403).json({
        error: 'CORS Error',
        message: err.message,
        allowedOrigins: allowedOrigins
      });
    } else {
      next(err);
    }
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🔒 CORS enabled with ${allowedOrigins.length} allowed origins`);
  console.log(`📝 To test CORS, visit: http://localhost:${port}/cors-test`);
}
bootstrap();

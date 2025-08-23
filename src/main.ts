import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  
  // Add cookie-parser middleware
  app.use(cookieParser());
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3001', 'https://sirisreports.co.uk', 'https://sirisreports.xyz','http://localhost:3002',"https://mcert-frontend.vercel.app/"],
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
    optionsSuccessStatus: 204
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();

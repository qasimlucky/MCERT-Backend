import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // Cookie parser middleware
  app.use(cookieParser());

  // ✅ Production-ready CORS config
  const allowedOrigins = [
    'http://localhost:3000',              // local dev
    'http://127.0.0.1:3000',              // alternative local dev
    'https://mcert-frontend.vercel.app',  // production frontend
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`❌ CORS blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // allow cookies/auth headers
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With, Accept',
    exposedHeaders: ['Authorization', 'Set-Cookie'],
  });

  // Optional: request logger
  app.use((req: any, res: any, next: any) => {
    console.log(`📥 ${req.method} ${req.url} from ${req.headers.origin}`);
    next();
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API running at http://localhost:${port}`);
  console.log(`🌍 Allowed origins: ${allowedOrigins.join(', ')}`);
}
bootstrap();

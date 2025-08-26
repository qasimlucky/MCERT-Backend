import { Controller, Get, Options, Res, Headers, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Response, Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Options('*')
  handleOptions(@Req() req: Request, @Res() res: Response) {
    console.log(`🔄 Global OPTIONS handler called for: ${req.url}`);
    console.log(`📋 OPTIONS headers:`, req.headers);
    
    // Set CORS headers for preflight - never block
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    // Always return 200 for preflight requests
    return res.status(200).json({ 
      message: 'CORS preflight handled - never blocked',
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
      origin: origin,
      corsStatus: 'preflight-allowed'
    });
  }

  @Get('health')
  healthCheck() {
    return { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Get('cors-test')
  corsTest(@Res() res: Response, @Headers() headers: any) {
    // Set CORS headers manually for testing
    res.header('Access-Control-Allow-Origin', 'https://mcert-frontend.vercel.app');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', '*'); // Allow all headers
    
    return res.json({ 
      message: 'CORS is working with all headers allowed!', 
      timestamp: new Date().toISOString(),
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:3002',
        'https://sirisreports.co.uk', 
        'https://sirisreports.xyz',
        'https://mcert-frontend.vercel.app'
      ],
      requestInfo: {
        method: 'GET',
        endpoint: '/cors-test',
        corsEnabled: true,
        allHeadersAllowed: true,
        preflightNeverBlocked: true
      },
      receivedHeaders: headers,
      corsConfiguration: {
        allowedHeaders: '*',
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
        maxAge: 86400,
        preflightContinue: true,
        optionsSuccessStatus: 200
      }
    });
  }

  @Get('api/status')
  apiStatus() {
    return {
      message: 'API is running',
      timestamp: new Date().toISOString(),
      cors: 'enabled',
      allHeaders: 'allowed',
      preflight: 'never-blocked',
      endpoints: [
        '/health',
        '/cors-test',
        '/api/status'
      ]
    };
  }
}

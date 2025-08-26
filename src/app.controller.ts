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
    
    // Set CORS headers for preflight - ALLOW EVERYTHING
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.header('Access-Control-Expose-Headers', '*');
    
    // Always return 200 for preflight requests
    return res.status(200).json({ 
      message: 'CORS preflight handled - COMPLETELY PERMISSIVE',
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
      origin: req.headers.origin,
      corsStatus: 'preflight-allowed-everything'
    });
  }

  @Get('public-cors-test')
  publicCorsTest(@Res() res: Response, @Headers() headers: any) {
    // Set CORS headers manually for testing - ALLOW EVERYTHING
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', '*'); // Allow ALL headers
    res.header('Access-Control-Allow-Methods', '*'); // Allow ALL methods
    res.header('Access-Control-Expose-Headers', '*'); // Expose ALL headers
    
    return res.json({ 
      message: 'PUBLIC CORS test - COMPLETELY PERMISSIVE configuration!', 
      timestamp: new Date().toISOString(),
      corsConfiguration: {
        origin: 'ALL origins allowed',
        methods: 'ALL methods allowed',
        headers: 'ALL headers allowed',
        exposedHeaders: 'ALL headers exposed',
        credentials: true,
        preflightNeverBlocked: true
      },
      requestInfo: {
        method: 'GET',
        endpoint: '/public-cors-test',
        corsEnabled: true,
        allOriginsAllowed: true,
        allHeadersAllowed: true,
        allMethodsAllowed: true,
        preflightNeverBlocked: true,
        authentication: 'NOT REQUIRED - PUBLIC ENDPOINT'
      },
      receivedHeaders: headers,
      corsSettings: {
        allowedHeaders: '*',
        allowedMethods: '*',
        allowedOrigins: '*',
        exposedHeaders: '*',
        credentials: true,
        maxAge: 86400,
        preflightContinue: true,
        optionsSuccessStatus: 200
      }
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
    // Set CORS headers manually for testing - ALLOW EVERYTHING
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', '*'); // Allow ALL headers
    res.header('Access-Control-Allow-Methods', '*'); // Allow ALL methods
    res.header('Access-Control-Expose-Headers', '*'); // Expose ALL headers
    
    return res.json({ 
      message: 'CORS is working with COMPLETELY PERMISSIVE configuration!', 
      timestamp: new Date().toISOString(),
      corsConfiguration: {
        origin: 'ALL origins allowed',
        methods: 'ALL methods allowed',
        headers: 'ALL headers allowed',
        exposedHeaders: 'ALL headers exposed',
        credentials: true,
        preflightNeverBlocked: true
      },
      requestInfo: {
        method: 'GET',
        endpoint: '/cors-test',
        corsEnabled: true,
        allOriginsAllowed: true,
        allHeadersAllowed: true,
        allMethodsAllowed: true,
        preflightNeverBlocked: true
      },
      receivedHeaders: headers,
      corsSettings: {
        allowedHeaders: '*',
        allowedMethods: '*',
        allowedOrigins: '*',
        exposedHeaders: '*',
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
      message: 'API is running with COMPLETELY PERMISSIVE CORS',
      timestamp: new Date().toISOString(),
      cors: 'completely-permissive',
      allOrigins: 'allowed',
      allHeaders: 'allowed',
      allMethods: 'allowed',
      preflight: 'never-blocked',
      endpoints: [
        '/health',
        '/cors-test',
        '/public-cors-test',
        '/api/status'
      ]
    };
  }
}

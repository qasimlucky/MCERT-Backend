import { Controller, Get, Options } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Options('*')
  handleOptions() {
    // This endpoint handles preflight OPTIONS requests
    return { message: 'CORS preflight handled' };
  }

  @Get('cors-test')
  corsTest() {
    return { 
      message: 'CORS is working!', 
      timestamp: new Date().toISOString(),
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:3002',
        'https://sirisreports.co.uk', 
        'https://sirisreports.xyz',
        'https://mcert-frontend.vercel.app'
      ]
    };
  }
}

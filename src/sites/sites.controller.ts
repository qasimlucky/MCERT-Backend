import { Controller, Get, Param, Query } from '@nestjs/common';
import { SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  findAll() {
    return this.sitesService.findAll();
  }

  @Get('id/:id')
  findOne(@Param('id') id: string) {
    return this.sitesService.findOne(id);
  }

  @Get('location/:location')
  findByLocation(@Param('location') location: string) {
    return this.sitesService.findByLocation(location);
  }

  @Get('name/:siteName')
  findBySiteName(@Param('siteName') siteName: string) {
    return this.sitesService.findBySiteName(siteName);
  }

  @Get('type/:type')
  findByType(@Param('type') type: string) {
    return this.sitesService.findByType(type);
  }
}

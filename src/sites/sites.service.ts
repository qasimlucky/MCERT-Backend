import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Site, SiteDocument } from './entities/site.entity';

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name) private siteModel: Model<SiteDocument>,
  ) {}

  async findAll(): Promise<Site[]> {
    return this.siteModel.find().exec();
  }

  async findOne(id: string): Promise<Site> {
    return await this.siteModel.findById(new Types.ObjectId(id)).exec();
  }

  async findByLocation(location: string): Promise<Site[]> {
    return this.siteModel.find({ location }).exec();
  }

  async findBySiteName(siteName: string): Promise<Site[]> {
    return this.siteModel.find({ siteName }).exec();
  }

  async findByType(type: string): Promise<Site[]> {
    return this.siteModel.find({ type }).exec();
  }
}

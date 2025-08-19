import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Document } from 'mongoose';

export type SiteDocument = Site & Document;

@Schema({ collection: 'sheets' }) // Specify the actual collection name in MongoDB
export class Site {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ required: true })
  siteName: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Date })
  installationDate: Date;

  @Prop({ type: Object })
  extraData: Record<string, any>;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController } from './forms.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Form, FormSchema } from './entities/form.entity';
import { IamModule } from '../iam/iam.module';
import { FileStorageService } from './file-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Form.name,
        schema: FormSchema,
      },
    ]),
    IamModule,
  ],
  controllers: [FormsController],
  providers: [FormsService, FileStorageService],
  exports: [FormsService, FileStorageService],
})
export class FormsModule {} 
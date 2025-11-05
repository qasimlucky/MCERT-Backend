import { Module } from '@nestjs/common';
import { SecondFormsService } from './second-forms.service';
import { SecondFormsController } from './second-forms.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SecondForm, SecondFormSchema } from './entities/second-form.entity';
import { IamModule } from '../iam/iam.module';
import { SecondFileStorageService } from './second-file-storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SecondForm.name,
        schema: SecondFormSchema,
      },
    ]),
    IamModule,
  ],
  controllers: [SecondFormsController],
  providers: [SecondFormsService, SecondFileStorageService],
  exports: [SecondFormsService, SecondFileStorageService],
})
export class SecondFormsModule {}


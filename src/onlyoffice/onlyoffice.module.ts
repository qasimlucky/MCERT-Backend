import { Module } from '@nestjs/common';
import { OnlyofficeController } from './onlyoffice.controller';
import { JwtService } from './jwt.service';

@Module({
  controllers: [OnlyofficeController],
  providers: [JwtService],
})
export class OnlyofficeModule {}

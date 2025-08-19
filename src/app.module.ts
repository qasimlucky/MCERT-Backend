import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { FormsModule } from './forms/forms.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IamModule } from './iam/iam.module';
import { SitesModule } from './sites/sites.module';
import { OnlyofficeModule } from './onlyoffice/onlyoffice.module';
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads', 'templates'),
      serveRoot: '/onlyoffice/uploads',
    }),
    ConfigModule.forRoot({}),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    FormsModule,
    IamModule,
    SitesModule,
    OnlyofficeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

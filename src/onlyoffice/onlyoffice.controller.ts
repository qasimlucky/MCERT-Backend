import { Controller, Post, Body, Get, Res, Param, Req } from '@nestjs/common';
import { join } from 'path';
import { Response, Request } from 'express';
import { Public } from 'src/iam/decorators/auth.decorator';
import { JwtService } from './jwt.service';
import * as fs from 'fs';
import * as axios from 'axios';

@Public()
@Controller('onlyoffice')
export class OnlyofficeController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('config')
  getEditorConfig(@Body() body: { filename: string; userId: string; userName: string }, @Req() req: Request) {
    try {
      const token4onlyoffice = 'yN4hrO5LWwPxEMkEKwxAW45erQ9uyJ1s';
      const origin = 'https://sirisreports.com';
      const config = {
        document: {
          fileType: 'docx',
          key: `${body.filename}---${process.env.RANDOM_ONLYOFFICE_REFERENCE_KEY}`,
          title: body.filename,
          url: `${origin}/onlyoffice/uploads/${body.filename}?token=${token4onlyoffice}`,
          permissions: {
            edit: true,
          },
        },
        editorConfig: {
          callbackUrl: `${origin}/onlyoffice/callback?token=${token4onlyoffice}`,
          user: {
            id: body.userId,
            name: body.userName,
          },
          coEditing: {
            mode: "fast",
            change: true,
          },
          custom: {
            filename: body.filename,
          },
          token: token4onlyoffice,
        },
        token: token4onlyoffice,
      };
      console.log("config ================");
      console.log(config);

      const token = this.jwtService.sign(config);
      console.log("token ================");
      console.log(token);

      return { ...config, token };
    } catch (error) {
      console.error('Error generating editor config:', error);
      return { error: 1 };
    }
  }

  @Post('callback')
  async handleCallback(@Body() body: any) {
    console.log('ONLYOFFICE callback payload:', body);
  
    if (body.status === 2 || body.status === 6) {
      // Document is ready to be saved
  
      const fileUrl = body.url;
  
      const key = body?.key;
      const filename = key?.split('---')[0];
      console.log('📝 Filename resolved from key:', filename);

      if (!filename) {
        console.error('❌ Missing filename in custom field');
        return { error: 1 };
      }

      const savePath = join(process.cwd(), 'uploads/templates', filename);

      if (!fs.existsSync(savePath)) {
        console.warn('⚠️ Save path does not exist, will try to create:', savePath);
      }
  
      try {
        const response = await axios.get(fileUrl, { responseType: 'stream' });
  
        return new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(savePath);
          (response.data as NodeJS.ReadableStream).pipe(writer);
          writer.on('finish', () => {
            console.log(`Saved updated file: ${filename}`);
            resolve({ error: 0 });
          });
          writer.on('error', (err) => {
            console.error('Failed to save document:', err);
            reject({ error: 1 });
          });
        });
      } catch (error) {
        console.error('Error downloading file from ONLYOFFICE:', error);
        return { error: 1 };
      }
    }
  
    return { error: 0 };
  }

  // @Get('uploads/:filename')
  // getFile(@Param('filename') filename: string, @Res() res: Response) {
  //   const filePath = join(process.cwd(), 'uploads/templates', filename);
  //   res.sendFile(filePath);
  // }
}

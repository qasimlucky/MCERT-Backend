import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { Public } from '../iam/decorators/auth.decorator';

@Public()
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  create(@Body() createFormDto: CreateFormDto) {
    return this.formsService.create(createFormDto);
  }

  @Get()
  findAll() {
    return this.formsService.findAll();
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.formsService.findByUserId(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFormDto: UpdateFormDto) {
    return this.formsService.update(id, updateFormDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formsService.remove(id);
  }

  // Diagnostic endpoints
  @Get('diagnostics/gridfs')
  diagnoseGridFS() {
    return this.formsService.diagnoseGridFSIssues();
  }

  @Get('diagnostics/connectivity')
  verifyConnectivity() {
    return this.formsService.verifyGridFSConnectivity();
  }

  @Get('diagnostics/check-file/:fileId')
  checkGridFSFile(@Param('fileId') fileId: string) {
    return this.formsService.checkGridFSFile(fileId);
  }

  @Post('diagnostics/recover')
  recoverOrphanedData() {
    return this.formsService.recoverOrphanedGridFSData();
  }

  @Post('diagnostics/emergency-recover/:fileId')
  emergencyRecoverFile(@Param('fileId') fileId: string) {
    return this.formsService.emergencyRecoverFile(fileId);
  }

  @Post('diagnostics/force-optimized/:fileId')
  forceOptimizedRetrieval(@Param('fileId') fileId: string) {
    return this.formsService.forceOptimizedRetrieval(fileId);
  }
} 
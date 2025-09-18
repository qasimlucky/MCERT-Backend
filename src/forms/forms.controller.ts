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
import { PaginationDto } from './dto/pagination.dto';
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
  findAll(@Query() paginationDto?: PaginationDto) {
    // If any pagination parameters are provided, use paginated version
    if (paginationDto && (paginationDto.page || paginationDto.limit || paginationDto.sortBy || paginationDto.search || paginationDto.status)) {
      return this.formsService.findAllPaginated(paginationDto);
    }
    // Otherwise, return all forms (backwards compatibility)
    return this.formsService.findAll();
  }

  @Get('paginated')
  findAllPaginated(@Query() paginationDto: PaginationDto) {
    return this.formsService.findAllPaginated(paginationDto);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string, @Query() paginationDto?: PaginationDto) {
    // If any pagination parameters are provided, use paginated version
    if (paginationDto && (paginationDto.page || paginationDto.limit || paginationDto.sortBy || paginationDto.search || paginationDto.status)) {
      return this.formsService.findByUserIdPaginated(userId, paginationDto);
    }
    // Otherwise, return all forms for the user (backwards compatibility)
    return this.formsService.findByUserId(userId);
  }

  @Get('user/:userId/paginated')
  findByUserIdPaginated(@Param('userId') userId: string, @Query() paginationDto: PaginationDto) {
    return this.formsService.findByUserIdPaginated(userId, paginationDto);
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
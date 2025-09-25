import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { 
  CreateFormDto, 
  UpdateFormDto, 
  FormSubmissionDto,
  FormQueryDto,
  BulkUpdateFormDto,
  BulkDeleteFormDto,
  PaginationDto
} from './dto/mcerts-forms.dto';
import { Public } from '../iam/decorators/auth.decorator';
import { AuthGuard } from '../iam/guards/auth/auth.guard';

@Public()
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createFormDto: CreateFormDto) {
    return this.formsService.create(createFormDto);
  }

  @Post('submit')
  @UseGuards(AuthGuard)
  submitForm(@Body() formSubmissionDto: FormSubmissionDto) {
    return this.formsService.submitForm(formSubmissionDto);
  }

  @Get()
  async findAll(@Query() query: FormQueryDto) {
    // If any pagination parameters are provided, use paginated version
    if (
      query &&
      (query.page ||
        query.limit ||
        query.status ||
        query.inspector ||
        query.siteName)
    ) {
      console.log('Using paginated findAll with params:', query);
      const paginationDto = new PaginationDto();

      // Map query parameters to DTO with proper type conversion
      paginationDto.page = query.page || 1;
      paginationDto.limit = query.limit || 10;
      paginationDto.sortBy = 'createdAt';
      paginationDto.sortOrder = query.sortOrder || 'desc';
      paginationDto.search = query.inspector || query.siteName;
      paginationDto.status = query.status;
      paginationDto.includeFormData = true;

      console.log(
        'Controller: Calling findAllPaginated with includeFormData:',
        paginationDto.includeFormData,
      );
      try {
        const result = await this.formsService.findAllPaginated(paginationDto);
        console.log('Controller: Successfully received pagination result');
        return result;
      } catch (error) {
        console.error('Controller: Error in findAllPaginated:', error);
        throw error;
      }
    }
    // Otherwise, return all forms (backwards compatibility)
    console.log('Using non-paginated findAll');
    return this.formsService.findAll();
  }

  @Get('paginated')
  async findAllPaginated(@Query() paginationDto: PaginationDto) {
    try {
      return await this.formsService.findAllPaginated(paginationDto);
    } catch (error) {
      console.error('Controller: Error in findAllPaginated:', error);
      throw error;
    }
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string, @Query() query: any) {
    // If any pagination parameters are provided, use paginated version
    if (
      query &&
      (query.page ||
        query.limit ||
        query.sortBy ||
        query.search ||
        query.status)
    ) {
      console.log('Using paginated findByUserId with params:', query);
      const paginationDto = new PaginationDto();

      // Map query parameters to DTO with proper type conversion
      paginationDto.page = query.page ? parseInt(query.page) : 1;
      paginationDto.limit = query.limit ? parseInt(query.limit) : 10;
      paginationDto.sortBy = query.sortBy || 'createdAt';
      paginationDto.sortOrder = query.sortOrder || 'desc';
      paginationDto.search = query.search;
      paginationDto.status = query.status;
      paginationDto.includeFormData = query.includeFormData === 'true';

      return this.formsService.findByUserIdPaginated(userId, paginationDto);
    }
    // Otherwise, return all forms for the user (backwards compatibility)
    console.log('Using non-paginated findByUserId');
    return this.formsService.findByUserId(userId);
  }

  @Get('user/:userId/paginated')
  findByUserIdPaginated(
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.formsService.findByUserIdPaginated(userId, paginationDto);
  }

  // New query endpoint (must be before :id route)
  @Get('query')
  @UseGuards(AuthGuard)
  getFormsByQuery(@Query() queryDto: FormQueryDto) {
    return this.formsService.getFormsByQuery(queryDto);
  }

  // New bulk operation endpoints
  @Patch('bulk/update')
  @UseGuards(AuthGuard)
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateFormDto) {
    return this.formsService.bulkUpdateForms(bulkUpdateDto);
  }

  @Delete('bulk/delete')
  @UseGuards(AuthGuard)
  bulkDelete(@Body() bulkDeleteDto: BulkDeleteFormDto) {
    return this.formsService.bulkDeleteForms(bulkDeleteDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateFormDto: UpdateFormDto) {
    return this.formsService.update(id, updateFormDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
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

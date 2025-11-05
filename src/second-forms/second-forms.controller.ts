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
  Req,
} from '@nestjs/common';
import { SecondFormsService } from './second-forms.service';
import { 
  CreateSecondFormDto, 
  UpdateSecondFormDto, 
  SecondFormSubmissionDto,
  SecondFormQueryDto,
  BulkUpdateSecondFormDto,
  BulkDeleteSecondFormDto,
  PaginationDto
} from './dto/second-forms.dto';
import { 
  InspectionListQueryDto, 
  InspectionListResponseDto 
} from './dto/inspection-list.dto';
import { Public } from '../iam/decorators/auth.decorator';
import { AuthGuard } from '../iam/guards/auth/auth.guard';

@Public()
@Controller('second-forms')
export class SecondFormsController {
  constructor(private readonly secondFormsService: SecondFormsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createSecondFormDto: CreateSecondFormDto, @Req() req: any) {
    // If @Body() returns empty object, use raw body as fallback
    if (!createSecondFormDto || Object.keys(createSecondFormDto).length === 0) {
      createSecondFormDto = req.body as CreateSecondFormDto;
    }
    
    // Extract userId from authorization header if not in body
    if (!createSecondFormDto.userId && req.user?.id) {
      createSecondFormDto.userId = req.user.id;
    }
    
    // Validate request size early to prevent processing oversized payloads
    const requestSize = JSON.stringify(createSecondFormDto).length;
    const maxRequestSize = 50 * 1024 * 1024; // 50MB limit
    
    if (requestSize > maxRequestSize) {
      return {
        success: false,
        error: 'Request payload too large',
        message: `Request size (${(requestSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (50MB)`
      };
    }
    
    return this.secondFormsService.create(createSecondFormDto);
  }

  @Post('submit')
  @UseGuards(AuthGuard)
  submitForm(@Body() formSubmissionDto: SecondFormSubmissionDto) {
    console.log('Submit second form endpoint - received data:', JSON.stringify(formSubmissionDto, null, 2));
    return this.secondFormsService.submitForm(formSubmissionDto);
  }

  @Get()
  async findAll(@Query() query: SecondFormQueryDto) {
    // If any pagination parameters are provided, use inspection list format
    if (
      query &&
      (query.page ||
        query.limit ||
        query.status ||
        query.inspector ||
        query.siteName)
    ) {
      console.log('Using inspection list format with params:', query);
      const inspectionQuery: InspectionListQueryDto = {
        page: query.page || 1,
        limit: query.limit || 5,
        status: query.status,
        inspector: query.inspector,
        siteName: query.siteName,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc'
      };
      return this.secondFormsService.getInspectionList(inspectionQuery);
    }
    
    // Otherwise, return all forms (backwards compatibility)
    console.log('Using non-paginated findAll for second forms');
    return this.secondFormsService.findAll();
  }

  @Get('paginated')
  async findAllPaginated(@Query() paginationDto: PaginationDto) {
    try {
      return await this.secondFormsService.findAllPaginated(paginationDto);
    } catch (error) {
      console.error('Controller: Error in findAllPaginated for second forms:', error);
      throw error;
    }
  }

  @Get(':id/data')
  findOneWithData(@Param('id') id: string) {
    return this.secondFormsService.findOneWithData(id);
  }

  @Post('migrate-to-files')
  @UseGuards(AuthGuard)
  async migrateToFileStorage() {
    return this.secondFormsService.migrateToFileStorage();
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
      console.log('Using paginated findByUserId with params for second forms:', query);
      const paginationDto = new PaginationDto();

      // Map query parameters to DTO with proper type conversion
      paginationDto.page = query.page ? parseInt(query.page) : 1;
      paginationDto.limit = query.limit ? parseInt(query.limit) : 10;
      paginationDto.sortBy = query.sortBy || 'createdAt';
      paginationDto.sortOrder = query.sortOrder || 'desc';
      paginationDto.search = query.search;
      paginationDto.status = query.status;
      paginationDto.includeFormData = query.includeFormData === 'true';

      return this.secondFormsService.findByUserIdPaginated(userId, paginationDto);
    }
    // Otherwise, return all forms for the user (backwards compatibility)
    console.log('Using non-paginated findByUserId for second forms');
    return this.secondFormsService.findByUserId(userId);
  }

  @Get('user/:userId/paginated')
  findByUserIdPaginated(
    @Param('userId') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.secondFormsService.findByUserIdPaginated(userId, paginationDto);
  }

  // New query endpoint (must be before :id route)
  @Get('query')
  @UseGuards(AuthGuard)
  getFormsByQuery(@Query() queryDto: SecondFormQueryDto) {
    return this.secondFormsService.getFormsByQuery(queryDto);
  }

  // New bulk operation endpoints
  @Patch('bulk/update')
  @UseGuards(AuthGuard)
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateSecondFormDto) {
    return this.secondFormsService.bulkUpdateForms(bulkUpdateDto);
  }

  @Delete('bulk/delete')
  @UseGuards(AuthGuard)
  bulkDelete(@Body() bulkDeleteDto: BulkDeleteSecondFormDto) {
    return this.secondFormsService.bulkDeleteForms(bulkDeleteDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.secondFormsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateSecondFormDto: UpdateSecondFormDto) {
    return this.secondFormsService.update(id, updateSecondFormDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.secondFormsService.remove(id);
  }
}


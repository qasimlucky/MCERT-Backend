import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationDto } from './create-site.dto';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {} 
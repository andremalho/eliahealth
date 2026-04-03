import { PartialType } from '@nestjs/mapped-types';
import { CreateVaginalSwabDto } from './create-vaginal-swab.dto.js';
export class UpdateVaginalSwabDto extends PartialType(CreateVaginalSwabDto) {}

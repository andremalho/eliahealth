import { IsString, IsNotEmpty } from 'class-validator';

export class AiFillDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

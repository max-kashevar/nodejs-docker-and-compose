import { IsString, Length } from 'class-validator';

export class SigninUserDto {
  @IsString()
  @Length(2, 30)
  username: string;

  @IsString()
  password: string;
}

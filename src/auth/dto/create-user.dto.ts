import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateUserDto {
    @IsEmail()
    email: string

    @IsString()
    @MinLength(6)
    password: string

    @IsString()
    @MinLength(2)
    @MaxLength(32)
    name: string
}

import { IsString } from 'class-validator'

export class CreateAlbumDto {
    @IsString()
    name: string

    @IsString()
    description?: string
}

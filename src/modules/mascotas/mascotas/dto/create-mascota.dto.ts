import { IsNotEmpty } from "class-validator";

export class CreateMascotaDto {
    @IsNotEmpty()
    name: string;
}

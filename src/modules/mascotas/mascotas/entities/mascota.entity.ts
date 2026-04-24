import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('mascotas')
export class Mascota {
     @PrimaryGeneratedColumn('uuid')
      id: string;

      @Column({name: 'nombre'})
      name: string;
    
}


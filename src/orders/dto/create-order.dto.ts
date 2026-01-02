import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'Mouse' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  product: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 15.5 })
  @IsNumber()
  @IsPositive()
  unitPriceUSD: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: '60f7a6c8b6d8a24f1c8f9c0a' })
  @IsMongoId()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: '2024-10-10' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

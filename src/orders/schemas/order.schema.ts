import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderItem = {
  product: string;
  quantity: number;
  unitPriceUSD: number;
};

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({
    type: [
      {
        product: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPriceUSD: { type: Number, required: true, min: 0 },
      },
    ],
    _id: false,
  })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  valueTotalUSD: number;

  @Prop({ required: true, min: 0 })
  valueTotalBRL: number;

  @Prop({ type: String, default: null })
  comprovanteURL?: string | null;

  createdAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

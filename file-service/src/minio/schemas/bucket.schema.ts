import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ toJSON: { versionKey: false }, toObject: { versionKey: false } })
export class Bucket extends Document {
  @Prop({ unique: true })
  name: string;
}

export const BucketSchema = SchemaFactory.createForClass(Bucket);

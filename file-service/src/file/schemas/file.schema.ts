import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ toJSON: { versionKey: false }, toObject: { versionKey: false } })
export class File extends Document {
  @Prop()
  name: string;

  @Prop()
  mimeType: string;

  @Prop()
  size: number;

  @Prop({ unique: true })
  key: string;

  @Prop({ ref: 'Bucket', type: mongoose.Schema.Types.ObjectId })
  bucket: {
    type: mongoose.Schema.Types.ObjectId;
  };

  @Prop()
  path: string;

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

export const FileSchema = SchemaFactory.createForClass(File);

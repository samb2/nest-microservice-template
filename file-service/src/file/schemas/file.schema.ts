import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({
  toJSON: {
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
    },
  },
  toObject: {
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
    },
  },
})
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

  @Prop()
  uploadedBy: string;

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

export const FileSchema = SchemaFactory.createForClass(File);

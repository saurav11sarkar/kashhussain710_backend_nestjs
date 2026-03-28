import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MotHistoryDocument = HydratedDocument<MotHistory>;

@Schema({ _id: false })
class RfrComment {
  @Prop() text?: string;
  @Prop() type?: string; // FAIL | ADVISORY | MAJOR | MINOR
  @Prop() dangerous?: boolean;
}

@Schema({ _id: false })
class MotTest {
  @Prop() completedDate?: string;
  @Prop() testResult?: string; // PASSED | FAILED
  @Prop() expiryDate?: string;
  @Prop() odometerValue?: string;
  @Prop() odometerUnit?: string;
  @Prop() odometerResultType?: string;

  @Prop({ type: [RfrComment], default: [] })
  rfrAndComments?: RfrComment[];
}

@Schema({ timestamps: true })
export class MotHistory {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'CheckCar' })
  checkCar: Types.ObjectId;

  @Prop({ uppercase: true, trim: true })
  registrationNumber: string;

  @Prop() make?: string;
  @Prop() model?: string;
  @Prop() primaryColour?: string;
  @Prop() fuelType?: string;
  @Prop() firstUsedDate?: string;
  @Prop() dvlaId?: string;
  @Prop() dvlaMake?: string;
  @Prop() engineSize?: string;

  @Prop({ type: [MotTest], default: [] })
  motTests?: MotTest[];

  // Calculated summary
  @Prop() totalTests?: number;
  @Prop() totalPassed?: number;
  @Prop() totalFailed?: number;
  @Prop() latestTestResult?: string;
  @Prop() latestExpiryDate?: string;
  @Prop() lastMileage?: number;
}

export const MotHistorySchema = SchemaFactory.createForClass(MotHistory);

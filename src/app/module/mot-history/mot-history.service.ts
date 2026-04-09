import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MotHistory, MotHistoryDocument } from './entities/mot-history.entity';

@Injectable()
export class MotHistoryService {
  constructor(
    @InjectModel(MotHistory.name)
    private readonly motHistoryModel: Model<MotHistoryDocument>,
  ) {}

  // একটি registration এর সব MOT history
  async findByRegistration(registrationNumber: string) {
    const vrn = registrationNumber.replace(/\s/g, '').toUpperCase();
    const data = await this.motHistoryModel
      .findOne({ registrationNumber: vrn })
      .sort({ createdAt: -1 });

    if (!data) throw new NotFoundException(`No MOT history found for ${vrn}`);

    return data;
  }

  // একজন user এর সব MOT history
  async findByUser(userId: string) {
    return this.motHistoryModel.find({ user: userId }).sort({ createdAt: -1 });
  }

  // একটি CheckCar এর MOT history
  async findByCheckCar(checkCarId: string) {
    const data = await this.motHistoryModel.findOne({ checkCar: checkCarId });
    if (!data)
      throw new NotFoundException('No MOT history found for this vehicle');
    return data;
  }

  // Single record by ID
  async findById(id: string) {
    const data = await this.motHistoryModel.findById(id);
    if (!data) throw new NotFoundException('MOT history not found');
    return data;
  }

  // Delete by ID
  async remove(id: string) {
    const data = await this.motHistoryModel.findByIdAndDelete(id);
    if (!data) throw new NotFoundException('MOT history not found');
    return { message: 'MOT history deleted successfully' };
  }
}

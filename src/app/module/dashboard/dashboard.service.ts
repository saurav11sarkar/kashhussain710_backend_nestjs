import { Injectable } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user/entities/user.entity';
import { Model } from 'mongoose';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async dashboardOverView() {
    const totalUser = await this.userModel.countDocuments();
    const activeUser = await this.userModel.countDocuments({
      status: 'active',
    });
    const suspended = await this.userModel.countDocuments({
      status: 'suspended',
    });

    const totalEarning = await this.userModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$balance' },
        },
      },
    ]);
    
    return {
      totalUser,
      activeUser,
      suspended,
      totalEarning: totalEarning[0]?.total || 0
    }
  }
}

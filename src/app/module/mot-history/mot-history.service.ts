import { Injectable } from '@nestjs/common';
import { CreateMotHistoryDto } from './dto/create-mot-history.dto';
import { UpdateMotHistoryDto } from './dto/update-mot-history.dto';

@Injectable()
export class MotHistoryService {
  create(createMotHistoryDto: CreateMotHistoryDto) {
    return 'This action adds a new motHistory';
  }

  findAll() {
    return `This action returns all motHistory`;
  }

  findOne(id: number) {
    return `This action returns a #${id} motHistory`;
  }

  update(id: number, updateMotHistoryDto: UpdateMotHistoryDto) {
    return `This action updates a #${id} motHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} motHistory`;
  }
}

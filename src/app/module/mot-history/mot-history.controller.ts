import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MotHistoryService } from './mot-history.service';
import { CreateMotHistoryDto } from './dto/create-mot-history.dto';
import { UpdateMotHistoryDto } from './dto/update-mot-history.dto';

@Controller('mot-history')
export class MotHistoryController {
  constructor(private readonly motHistoryService: MotHistoryService) {}

  @Post()
  create(@Body() createMotHistoryDto: CreateMotHistoryDto) {
    return this.motHistoryService.create(createMotHistoryDto);
  }

  @Get()
  findAll() {
    return this.motHistoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.motHistoryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMotHistoryDto: UpdateMotHistoryDto) {
    return this.motHistoryService.update(+id, updateMotHistoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.motHistoryService.remove(+id);
  }
}

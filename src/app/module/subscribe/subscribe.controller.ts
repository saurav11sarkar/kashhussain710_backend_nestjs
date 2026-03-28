import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscribeService } from './subscribe.service';
import { CreateSubscribeDto } from './dto/create-subscribe.dto';
import { UpdateSubscribeDto } from './dto/update-subscribe.dto';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';

@Controller('subscribe')
export class SubscribeController {
  constructor(private readonly subscribeService: SubscribeService) {}

  @Post()
  @ApiOperation({
    summary: 'Subscribe plan create',
  })
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateSubscribeDto })
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.CREATED)
  async createSubscribe(@Body() createSubscribeDto: CreateSubscribeDto) {
    const result =
      await this.subscribeService.createSubscribe(createSubscribeDto);

    return {
      message: 'subscribe create successfuly',
      data: result,
    };
  }
}

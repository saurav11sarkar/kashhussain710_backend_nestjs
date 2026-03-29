import { Controller, Post, Param, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import AuthGuard from 'src/app/middlewares/auth.guard';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':subscribeId')
  @ApiOperation({
    summary: 'Create payment intent for car checker subscription',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('user'))
  async payCarCheckerSubscribe(
    @Req() req: Request,
    @Param('subscribeId') subscribeId: string,
  ) {
    const result = await this.paymentService.payCarCheckerSubscribe(
      req.user!.id,
      subscribeId,
    );
    return {
      message: 'Payment intent created successfully',
      data: result,
    };
  }
}

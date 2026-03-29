import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './app/config';
import { CheckCarModule } from './app/module/check-car/check-car.module';
import { ContactModule } from './app/module/contact/contact.module';
import { AuthModule } from './app/module/auth/auth.module';
import { UserModule } from './app/module/user/user.module';
import { MotHistoryModule } from './app/module/mot-history/mot-history.module';
import { DashboardModule } from './app/module/dashboard/dashboard.module';
import { SubscribeModule } from './app/module/subscribe/subscribe.module';
import { PaymentModule } from './app/module/payment/payment.module';
import { WebhookModule } from './app/module/webhook/webhook.module';

const databaseImports = config.isMongoEnabled
  ? [
      MongooseModule.forRoot(config.mongoUri as string, {
        lazyConnection: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      }),
      UserModule,
      AuthModule,
      ContactModule,
    ]
  : [];

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ...databaseImports, CheckCarModule, MotHistoryModule, DashboardModule, SubscribeModule, PaymentModule, WebhookModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

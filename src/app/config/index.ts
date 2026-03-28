import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  isMongoEnabled: Boolean(process.env.MONGO_URI),
  bcryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES,
  },
  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  email: {
    expires: process.env.EMAIL_EXPIRES,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    address: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    admin: process.env.ADMIN_EMAIL,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  devla: {
    baseUrl:
      process.env.DVLA_BASE_URL ||
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
    freeDevialKey: process.env.DVLA_FREE_API_KEY || process.env.FREE_DEVIAL_KEY,
    paidDevialKey: process.env.DVLA_PAID_API_KEY || process.env.PAID_DEVIAL_KEY,
    defaultKeyType: process.env.DVLA_KEY_TYPE || 'free',
  },
  mot: {
    clientId: process.env.MOT_CLIENT_ID,
    clientSecret: process.env.MOT_CLIENT_SECRET,
    apiKey: process.env.MOT_API_KEY,
    scopeUrl: process.env.MOT_SCOPE_URL || 'https://tapi.dvsa.gov.uk/.default',
    tokenUrl: process.env.MOT_TOKEN_URL,
    apiBase:
      process.env.MOT_API_BASE ||
      'https://history.mot.api.gov.uk/v1/trade/vehicles',
  },
  frontendUrl: process.env.FRONTEND_URL,
};

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
  // dvla: {
  //   baseUrl:
  //     process.env.DVLA_BASE_URL ||
  //     'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
  //   defaultKeyType: process.env.DVLA_DEFAULT_KEY_TYPE || 'free',
  //   freeApiKey: process.env.FREE_DEVIAL_KEY || process.env.DVLA_FREE_API_KEY,
  //   paidApiKey: process.env.PAID_DEVIAL_KEY || process.env.DVLA_PAID_API_KEY,
  // },
  // dvsa: {
  //   clientId: process.env.DVSA_CLIENT_ID,
  //   clientSecret: process.env.DVSA_CLIENT_SECRET,
  //   apiKey: process.env.DVSA_API_KEY,
  //   scope: process.env.DVSA_SCOPE || 'https://tapi.dvsa.gov.uk/.default',
  //   tokenUrl: process.env.DVSA_TOKEN_URL,
  //   motApiUrl:
  //     process.env.DVSA_MOT_API_URL ||
  //     'https://history.mot.api.gov.uk/v1/trade/vehicles/registration/',
  // },
  dvla: {
    baseUrl:
      process.env.DVLA_BASE_URL ||
      'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles',
    defaultKeyType: process.env.DVLA_DEFAULT_KEY_TYPE || 'free',
    freeApiKey: process.env.FREE_DEVIAL_KEY,
    paidApiKey: process.env.PAID_DEVIAL_KEY,
  },
  dvsa: {
    // MOT History API key (x-api-key header এ যাবে)
    motApiKey: process.env.DVSA_MOT_HISTORY,
    motApiUrl:
      process.env.DVSA_MOT_API_URL ||
      'https://history.mot.api.gov.uk/v1/trade/vehicles/registration/',
    // OAuth2 credentials (client থেকে পাওয়া গেলে .env এ বসাও)
    clientId: process.env.DVSA_CLIENT_ID,
    clientSecret: process.env.DVSA_CLIENT_SECRET,
    tokenUrl: process.env.DVSA_TOKEN_URL,
    scope: process.env.DVSA_SCOPE || 'https://tapi.dvsa.gov.uk/.default',
  },
  mot: {
    clientId: process.env.MOT_CLIENT_ID,
    clientSecret: process.env.MOT_CLIENT_SECRET,
    apiKey: process.env.MOT_API_KEY,
    scopeUrl: process.env.MOT_SCOPE_URL,
    tokenUrl: process.env.MOT_TOKEN_URL,
    apiBase: process.env.MOT_API_BASE,
  },
  frontendUrl: process.env.FRONTEND_URL,
};

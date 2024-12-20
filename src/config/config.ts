import 'dotenv/config';
import Joi from 'joi';

//env config schema
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development').required(),
    PORT: Joi.number().default(8080),
    PREFIX: Joi.string().default('/api'),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.string().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    CLIENT_URL: Joi.string().required().description('Client url'),
    CORS_ORIGIN: Joi.string().default('*'),
    CORS_METHODS: Joi.string().default('GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
    CORS_CREDENTIALS: Joi.boolean().default(false),
    CORS_MAX_AGE: Joi.number().default(86400),
    AWS_REGION: Joi.string().required(),
    AWS_ACCESS_KEY: Joi.string().required(),
    AWS_SECRET_KEY: Joi.string().required(),
    AWS_BUCKET_NAME: Joi.string().required(),
    GCP_KEY_FILE_PATH: Joi.string().required(),
    GCP_BUCKET_NAME: Joi.string().required(),
    VERTEXT_AI_PROJECT: Joi.string().optional(),
    VERTEXT_LOCATION: Joi.string().optional(),
    VERTEXT_MODEL: Joi.string().optional(),
    REDIS_HOST: Joi.string().optional(),
    REDIS_PORT: Joi.string().optional(),
    REDIS_PASSWORD: Joi.string().optional(),
  })
  .unknown();

const { value: env, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

//env config values
const config = {
  env: env.NODE_ENV,
  prefix: env.PREFIX,
  port: env.PORT,
  clientUrl: env.CLIENT_URL,
  mongoose: {
    url: env.MONGODB_URL,
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: env.JWT_SECRET,
    accessExpirationMinutes: env.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: env.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: env.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    cookieOptions: {
      httpsOnly: env.NODE_ENV === 'production',
      secure: env.NODE_ENV === 'production',
      signed: true,
    },
  },
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD,
    },
  },
  cors: {
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    methods: env.CORS_METHODS.split(','),
    credentials: env.CORS_CREDENTIALS,
    maxAge: env.CORS_MAX_AGE,
  },
  aws: {
    s3: {
      region: env.AWS_REGION,
      accessKeyId: env.AWS_ACCESS_KEY,
      secretAccessKey: env.AWS_SECRET_KEY,
      bucketName: env.AWS_BUCKET_NAME,
    },
  },
  gcp: {
    keyFilePath: env.GCP_KEY_FILE_PATH,
    bucketName: env.GCP_BUCKET_NAME,
  },
  vertext: {
    vertext_ai_project: env.VERTEXT_AI_PROJECT,
    vertext_location: env.VERTEXT_LOCATION,
    vertext_model: env.VERTEXT_MODEL,
  },
  radis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
};

export default config;

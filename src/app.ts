import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import passport from 'passport';
import config from './config/config';
import { authLimiter, catchAsync } from './modules/utils';
import routes from './routes';

const app: Express = express();

// prefix for routes
const PREFIX = config.prefix;

// set security HTTP headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: config.cors.origin,
  methods: config.cors.methods,
  credentials: config.cors.credentials,
  maxAge: config.cors.maxAge,
};

// Enable CORS
app.use(cors());

// Handle preflight requests
app.options('*', cors(corsOptions));

// parse json request body
app.use(express.json());

// jwt authentication
app.use(passport.initialize());

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use(`${PREFIX}/auth`, authLimiter);
}

// root route
app.get(
  '/',
  catchAsync(async (_: Request, res: Response) => {
    res.send({ status: 'Server is running' });
  }),
);

// api routes
app.use(`${PREFIX}`, routes);

// Error-handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack); // Log the error details
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

export default app;

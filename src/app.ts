import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createYoga, renderGraphiQL } from 'graphql-yoga';
import { schema } from './graphql/schema.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { extractAuthContext } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.routes.js';
import { GraphQLContext } from './types/context.js';
import { GraphQLError, parse, validate } from 'graphql';
import { AppError } from './errors/AppError.js';
import { queryLimitsRule } from './graphql/queryLimits.js';

// Repositories
import { RestaurantRepository } from './repositories/restaurant.repository.js';
import { RestaurantFeatureRepository } from './repositories/feature.repository.js';
import {
  DeliveryMetricRepository,
  RestaurantStatisticRepository,
} from './repositories/delivery.repository.js';
import { MenuRepository } from './repositories/menu.repository.js';
import { CountryRepository } from './repositories/country.repository.js';
import { CityRepository } from './repositories/city.repository.js';
import { CuisineRepository } from './repositories/cuisine.repository.js';
import { AnalyticsRepository } from './repositories/analytics.repository.js';

// Services
import { RestaurantService } from './services/restaurant.service.js';
import { CityService } from './services/city.service.js';
import { MenuService } from './services/menu.service.js';
import { AnalyticsService } from './services/analytics.service.js';
import { createDataLoaders } from './dataloaders/index.js';

export function createApp(): Express {
  const app = express();

  // 1. Core Middlewares
  app.use(requestIdMiddleware);

  // Helmet with relaxed policies in development so GraphiQL UI works seamlessly in any browser/webview
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
    })
  );

  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: config.CORS_ORIGIN !== '*',
    })
  );

  app.use(express.json({ limit: '2mb' }));

  // 2. Rate Limiter (Protects GraphQL endpoint against abuse)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/graphql', limiter);

  // 3. Health & Monitoring Routes
  app.use(healthRouter);

  // 4. Initialize Singleton Repositories & Services
  const restaurantRepo = new RestaurantRepository();
  const featureRepo = new RestaurantFeatureRepository();
  const statsRepo = new RestaurantStatisticRepository();
  const deliveryRepo = new DeliveryMetricRepository();
  const menuRepo = new MenuRepository();
  const countryRepo = new CountryRepository();
  const cityRepo = new CityRepository();
  const cuisineRepo = new CuisineRepository();
  const analyticsRepo = new AnalyticsRepository();

  const services = {
    restaurant: new RestaurantService(restaurantRepo),
    city: new CityService(cityRepo, countryRepo),
    menu: new MenuService(menuRepo),
    analytics: new AnalyticsService(analyticsRepo, cuisineRepo),
  };

  // 5. GraphQL Yoga Server
  const yoga = createYoga<GraphQLContext>({
    schema,
    maskedErrors: {
      maskError: (error, message, isDev) => {
        if (error instanceof AppError) {
          return error.toGraphQLError();
        }
        return new GraphQLError(
          isDev ? message : 'Internal server error',
          { extensions: { code: 'INTERNAL_SERVER_ERROR' } }
        );
      },
    },
    graphqlEndpoint: '/graphql',
    graphiql: config.NODE_ENV !== 'production' ? {
      title: 'DineGraph API Explorer',
      defaultQuery: `# Welcome to PostgreSQL Learning Backend!
# Try running this query to fetch restaurants with menus, features, and ratings:

query GetRestaurants {
  restaurants(pagination: { limit: 5 }) {
    totalCount
    items {
      restaurant_id
      restaurant_name
      cuisine
      average_rating
      city
      country
      features {
        wifi
        outdoor_seating
        hours_24
      }
      menus {
        item_name
        price
        food_category
        nutrition {
          calories
          protein
        }
      }
    }
  }
}
`,
    } : false,
    renderGraphiQL: (opts) => {
      const rawHtml = renderGraphiQL(opts);
      const polyfill = `<script>
        (function() {
          try {
            var testKey = '__storage_test__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
          } catch (e) {
            console.warn('LocalStorage is restricted by browser security settings. Enabling in-memory fallback.');
            var createMockStorage = function() {
              var store = {};
              return {
                getItem: function(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
                setItem: function(k, v) { store[k] = String(v); },
                removeItem: function(k) { delete store[k]; },
                clear: function() { store = {}; },
                get length() { return Object.keys(store).length; },
                key: function(i) { return Object.keys(store)[i] || null; }
              };
            };
            try {
              Object.defineProperty(window, 'localStorage', { value: createMockStorage(), configurable: true, writable: true });
            } catch (err) {}
            try {
              Object.defineProperty(window, 'sessionStorage', { value: createMockStorage(), configurable: true, writable: true });
            } catch (err) {}
          }
        })();
      </script>`;
      return rawHtml.replace('<head>', '<head>' + polyfill);
    },
    context: ({ req, res }: { req: Request; res: Response }): GraphQLContext => {
      const requestId = (req.headers['x-request-id'] as string) || 'unknown';
      const user = extractAuthContext(req);

      // Create scoped DataLoaders per request
      const loaders = createDataLoaders({
        restaurantRepo,
        featureRepo,
        statsRepo,
        deliveryRepo,
        menuRepo,
        countryRepo,
        cityRepo,
      });

      return {
        req,
        res,
        requestId,
        user,
        loaders,
        services,
      };
    },
    logging: {
      debug: (...args) => logger.debug(args),
      info: (...args) => logger.info(args),
      warn: (...args) => logger.warn(args),
      error: (...args) => logger.error(args),
    },
  });

  // Reject excessively deep or wide documents before resolver execution.
  app.use('/graphql', (req: Request, res: Response, next: NextFunction) => {
    const rawQuery = req.method === 'GET' ? req.query.query : req.body?.query;
    const queryText = typeof rawQuery === 'string' ? rawQuery : undefined;
    if (!queryText) {
      next();
      return;
    }
    try {
      const document = parse(queryText);
      const errors = validate(schema, document, [queryLimitsRule]);
      if (errors.length > 0) {
        res.status(400).json({ errors: errors.map((error) => ({
          message: error.message,
          extensions: error.extensions,
        })) });
        return;
      }
      next();
    } catch {
      next();
    }
  });

  // Mount Yoga handler to Express route safely
  app.use('/graphql', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await yoga(req, res);
    } catch (err) {
      next(err);
    }
  });

  // Root Welcome Route
  app.get('/', (_req, res) => {
    res.json({
      message: 'DineGraph API is running',
      graphql: '/graphql',
      health: '/health',
      ready: '/ready',
      version: '1.0.0',
    });
  });

  // 6. Global Error Handler
  app.use(errorHandler);

  return app;
}

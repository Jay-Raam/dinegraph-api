import { Request, Response } from 'express';
import { DataLoaders } from '../dataloaders/index.js';
import { RestaurantService } from '../services/restaurant.service.js';
import { CityService } from '../services/city.service.js';
import { MenuService } from '../services/menu.service.js';
import { AnalyticsService } from '../services/analytics.service.js';

export interface UserContext {
  userId?: string;
  role?: string;
  isAuthenticated: boolean;
}

export interface GraphQLContext {
  req: Request;
  res: Response;
  requestId: string;
  user: UserContext;
  loaders: DataLoaders;
  services: {
    restaurant: RestaurantService;
    city: CityService;
    menu: MenuService;
    analytics: AnalyticsService;
  };
}

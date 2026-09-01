import {
  AnalyticsRepository,
  CuisineMarketShare,
  CityDiningOverview,
  TopRankedDish,
} from '../repositories/analytics.repository.js';
import { CuisineRepository } from '../repositories/cuisine.repository.js';
import { Cuisine } from '../types/models.js';

export class AnalyticsService {
  constructor(
    private readonly analyticsRepo: AnalyticsRepository,
    private readonly cuisineRepo: CuisineRepository
  ) {}

  async getCuisineMarketShare(minRestaurants = 1): Promise<CuisineMarketShare[]> {
    return this.analyticsRepo.getCuisineMarketShare(minRestaurants);
  }

  async getCityDiningOverview(): Promise<CityDiningOverview[]> {
    return this.analyticsRepo.getCityDiningOverview();
  }

  async getTopDishesPerCategory(limitPerCategory = 3): Promise<TopRankedDish[]> {
    return this.analyticsRepo.getTopDishesPerCategory(limitPerCategory);
  }

  async getAllCuisines(): Promise<Cuisine[]> {
    return this.cuisineRepo.findAll();
  }
}

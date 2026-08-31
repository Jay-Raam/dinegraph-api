import { RestaurantRepository } from '../repositories/restaurant.repository.js';
import {
  Restaurant,
  RestaurantFilterInput,
  PaginationInput,
  PaginatedResult,
} from '../types/models.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';

export class RestaurantService {
  constructor(private readonly restaurantRepo: RestaurantRepository) {}

  async getRestaurantById(id: string): Promise<Restaurant> {
    if (!id) {
      throw new ValidationError('Restaurant ID is required');
    }
    const restaurant = await this.restaurantRepo.findById(id);
    if (!restaurant) {
      throw new NotFoundError(`Restaurant with ID "${id}" not found`);
    }
    return restaurant;
  }

  async getRestaurants(
    filter?: RestaurantFilterInput,
    pagination?: PaginationInput
  ): Promise<PaginatedResult<Restaurant>> {
    return this.restaurantRepo.findMany(filter, pagination);
  }

  async getRestaurantsByCity(city: string, country?: string): Promise<Restaurant[]> {
    return this.restaurantRepo.findByCity(city, country);
  }

  async createRestaurant(
    input: Omit<Restaurant, 'average_rating' | 'review_count'>
  ): Promise<Restaurant> {
    if (!input.restaurant_name) {
      throw new ValidationError('Restaurant name is required');
    }
    if (!input.restaurant_id) {
      input.restaurant_id = `rest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
    return this.restaurantRepo.create(input);
  }

  async updateRestaurant(
    id: string,
    updates: Partial<Restaurant>
  ): Promise<Restaurant> {
    const existing = await this.restaurantRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Restaurant with ID "${id}" not found`);
    }
    const updated = await this.restaurantRepo.update(id, updates);
    if (!updated) {
      throw new NotFoundError(`Failed to update restaurant "${id}"`);
    }
    return updated;
  }

  async deleteRestaurant(id: string): Promise<boolean> {
    const existing = await this.restaurantRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Restaurant with ID "${id}" not found`);
    }
    return this.restaurantRepo.delete(id);
  }
}

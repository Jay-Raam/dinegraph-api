import { MenuRepository } from '../repositories/menu.repository.js';
import {
  Menu,
  MenuFilterInput,
  PaginationInput,
  PaginatedResult,
  Nutrition,
  PriceHistory,
} from '../types/models.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';

export class MenuService {
  constructor(private readonly menuRepo: MenuRepository) {}

  async getMenuById(id: string): Promise<Menu> {
    const menu = await this.menuRepo.findById(id);
    if (!menu) {
      throw new NotFoundError(`Menu item with ID "${id}" not found`);
    }
    return menu;
  }

  async getMenus(
    filter?: MenuFilterInput,
    pagination?: PaginationInput
  ): Promise<PaginatedResult<Menu>> {
    return this.menuRepo.findMany(filter, pagination);
  }

  async getMenusByRestaurant(restaurantId: string): Promise<Menu[]> {
    return this.menuRepo.findByRestaurantId(restaurantId);
  }

  async getNutrition(menuId: string): Promise<Nutrition | null> {
    return this.menuRepo.findNutrition(menuId);
  }

  async getPriceHistory(menuId: string): Promise<PriceHistory[]> {
    return this.menuRepo.findPriceHistory(menuId);
  }

  async createMenuItem(data: {
    restaurant_id: string;
    item_name: string;
    price: number;
    food_category?: string;
    currency?: string;
    calories?: number;
    protein?: number;
    fat?: number;
    carbohydrates?: number;
    sugar?: number;
    sodium?: number;
    vegetarian?: boolean;
    vegan?: boolean;
    gluten_free?: boolean;
  }): Promise<Menu> {
    if (!data.restaurant_id || !data.item_name || data.price === undefined) {
      throw new ValidationError('restaurant_id, item_name, and price are required');
    }
    return this.menuRepo.create(data);
  }
}

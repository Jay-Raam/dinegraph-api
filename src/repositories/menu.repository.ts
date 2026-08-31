import { query } from '../database/pool.js';
import { BaseRepository } from './base.repository.js';
import {
  Menu,
  Nutrition,
  PriceHistory,
  MenuFilterInput,
  PaginationInput,
  PaginatedResult,
} from '../types/models.js';

export class MenuRepository extends BaseRepository {
  async findById(id: string): Promise<Menu | null> {
    const res = await query(
      `SELECT * FROM public.menus WHERE menu_id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<Menu>(res.rows[0] as Record<string, unknown>);
  }

  async findByRestaurantId(restaurantId: string): Promise<Menu[]> {
    const res = await query(
      `SELECT * FROM public.menus WHERE restaurant_id = $1 ORDER BY price ASC, menu_id ASC`,
      [restaurantId]
    );
    return this.normalizeRows<Menu>(res.rows as Record<string, unknown>[]);
  }

  async findByRestaurantIds(restaurantIds: readonly string[]): Promise<Menu[][]> {
    if (restaurantIds.length === 0) return [];
    const res = await query(
      `SELECT * FROM public.menus WHERE restaurant_id = ANY($1::text[]) ORDER BY price ASC, menu_id ASC`,
      [restaurantIds as string[]]
    );
    const rows = this.normalizeRows<Menu>(res.rows as Record<string, unknown>[]);
    const map = new Map<string, Menu[]>();
    for (const r of rows) {
      const list = map.get(r.restaurant_id) || [];
      list.push(r);
      map.set(r.restaurant_id, list);
    }
    return restaurantIds.map((id) => map.get(id) || []);
  }

  async findMany(
    filter: MenuFilterInput = {},
    pagination: PaginationInput = { limit: 20, offset: 0 }
  ): Promise<PaginatedResult<Menu>> {
    const { limit, offset } = this.normalizePagination(pagination);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (filter.restaurantId) {
      conditions.push(`restaurant_id = $${index++}`);
      params.push(filter.restaurantId);
    }
    if (filter.foodCategory) {
      conditions.push(`LOWER(food_category) = LOWER($${index++})`);
      params.push(filter.foodCategory);
    }
    if (filter.isVegetarian !== undefined) {
      conditions.push(`vegetarian = $${index++}`);
      params.push(filter.isVegetarian);
    }
    if (filter.isVegan !== undefined) {
      conditions.push(`vegan = $${index++}`);
      params.push(filter.isVegan);
    }
    if (filter.isGlutenFree !== undefined) {
      conditions.push(`gluten_free = $${index++}`);
      params.push(filter.isGlutenFree);
    }
    if (filter.maxPrice !== undefined) {
      conditions.push(`price <= $${index++}`);
      params.push(filter.maxPrice);
    }
    if (filter.maxCalories !== undefined) {
      conditions.push(`calories <= $${index++}`);
      params.push(filter.maxCalories);
    }
    if (filter.search) {
      conditions.push(`(item_name ILIKE $${index} OR food_category ILIKE $${index})`);
      params.push(`%${filter.search}%`);
      index++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) AS total FROM public.menus ${whereClause}`,
      params
    );
    const totalCount = parseInt(
      (countRes.rows[0] as { total?: string | number })?.total?.toString() || '0',
      10
    );

    const dataRes = await query(
      `SELECT * FROM public.menus ${whereClause} ORDER BY price ASC, menu_id ASC LIMIT $${index++} OFFSET $${index++}`,
      [...params, limit, offset]
    );

    const items = this.normalizeRows<Menu>(dataRes.rows as Record<string, unknown>[]);

    return {
      items,
      totalCount,
      hasMore: offset + items.length < totalCount,
      limit,
      offset,
    };
  }

  async findNutrition(menuId: string): Promise<Nutrition | null> {
    const res = await query(
      `SELECT * FROM public.nutrition WHERE menu_id = $1 LIMIT 1`,
      [menuId]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<Nutrition>(res.rows[0] as Record<string, unknown>);
  }

  async findNutritionBatch(menuIds: readonly string[]): Promise<(Nutrition | null)[]> {
    if (menuIds.length === 0) return [];
    const res = await query(
      `SELECT * FROM public.nutrition WHERE menu_id = ANY($1::text[])`,
      [menuIds as string[]]
    );
    const rows = this.normalizeRows<Nutrition>(res.rows as Record<string, unknown>[]);
    const map = new Map<string, Nutrition>();
    for (const r of rows) {
      map.set(r.menu_id, r);
    }
    return menuIds.map((id) => map.get(id) ?? null);
  }

  async findPriceHistory(menuId: string): Promise<PriceHistory[]> {
    const res = await query(
      `SELECT * FROM public.price_history WHERE menu_id = $1 ORDER BY timestamp DESC, id DESC`,
      [menuId]
    );
    return this.normalizeRows<PriceHistory>(res.rows as Record<string, unknown>[]);
  }

  async findPriceHistoryBatch(menuIds: readonly string[]): Promise<PriceHistory[][]> {
    if (menuIds.length === 0) return [];
    const res = await query(
      `SELECT * FROM public.price_history WHERE menu_id = ANY($1::text[]) ORDER BY timestamp DESC, id DESC`,
      [menuIds as string[]]
    );
    const rows = this.normalizeRows<PriceHistory>(res.rows as Record<string, unknown>[]);
    const map = new Map<string, PriceHistory[]>();
    for (const r of rows) {
      const list = map.get(r.menu_id) || [];
      list.push(r);
      map.set(r.menu_id, list);
    }
    return menuIds.map((id) => map.get(id) || []);
  }

  async create(data: Omit<Menu, 'menu_id'> & { menu_id?: string }): Promise<Menu> {
    const menuId = data.menu_id || `menu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const res = await query(
      `INSERT INTO public.menus (
        menu_id, restaurant_id, food_category, item_name, price, currency,
        calories, protein, fat, carbohydrates, sugar, sodium, vegetarian, vegan, gluten_free
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        menuId,
        data.restaurant_id,
        data.food_category ?? null,
        data.item_name,
        data.price ?? 0,
        data.currency ?? 'USD',
        data.calories ?? null,
        data.protein ?? null,
        data.fat ?? null,
        data.carbohydrates ?? null,
        data.sugar ?? null,
        data.sodium ?? null,
        data.vegetarian ?? false,
        data.vegan ?? false,
        data.gluten_free ?? false,
      ]
    );
    return this.normalizeRow<Menu>(res.rows[0] as Record<string, unknown>);
  }
}

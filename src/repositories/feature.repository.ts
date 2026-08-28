import { query } from '../database/pool.js';
import { BaseRepository } from './base.repository.js';
import { RestaurantFeatures } from '../types/models.js';

export class RestaurantFeatureRepository extends BaseRepository {
  async findByRestaurantId(restaurantId: string): Promise<RestaurantFeatures | null> {
    const res = await query(
      `SELECT
        restaurant_id,
        outdoor_seating,
        wifi,
        parking,
        wheelchair_accessible,
        pet_friendly,
        kid_friendly,
        vegetarian,
        vegan,
        halal,
        alcohol,
        drive_through,
        "24_hours" as hours_24,
        live_music
      FROM public.restaurant_features
      WHERE restaurant_id = $1
      LIMIT 1`,
      [restaurantId]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<RestaurantFeatures>(res.rows[0] as Record<string, unknown>);
  }

  async findByRestaurantIds(
    restaurantIds: readonly string[]
  ): Promise<(RestaurantFeatures | null)[]> {
    if (restaurantIds.length === 0) return [];
    const res = await query(
      `SELECT
        restaurant_id,
        outdoor_seating,
        wifi,
        parking,
        wheelchair_accessible,
        pet_friendly,
        kid_friendly,
        vegetarian,
        vegan,
        halal,
        alcohol,
        drive_through,
        "24_hours" as hours_24,
        live_music
      FROM public.restaurant_features
      WHERE restaurant_id = ANY($1::text[])`,
      [restaurantIds as string[]]
    );
    const rows = this.normalizeRows<RestaurantFeatures>(
      res.rows as Record<string, unknown>[]
    );
    const map = new Map<string, RestaurantFeatures>();
    for (const r of rows) {
      map.set(r.restaurant_id, r);
    }
    return restaurantIds.map((id) => map.get(id) ?? null);
  }
}

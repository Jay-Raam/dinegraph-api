import { query } from '../database/pool.js';
import { BaseRepository } from './base.repository.js';
import { DeliveryMetrics, RestaurantStatistics } from '../types/models.js';

export class DeliveryMetricRepository extends BaseRepository {
  async findByRestaurantId(restaurantId: string): Promise<DeliveryMetrics | null> {
    const res = await query(
      `SELECT * FROM public.delivery_metrics WHERE restaurant_id = $1 LIMIT 1`,
      [restaurantId]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<DeliveryMetrics>(res.rows[0] as Record<string, unknown>);
  }

  async findByRestaurantIds(
    restaurantIds: readonly string[]
  ): Promise<(DeliveryMetrics | null)[]> {
    if (restaurantIds.length === 0) return [];
    const res = await query(
      `SELECT * FROM public.delivery_metrics WHERE restaurant_id = ANY($1::text[])`,
      [restaurantIds as string[]]
    );
    const rows = this.normalizeRows<DeliveryMetrics>(res.rows as Record<string, unknown>[]);
    const map = new Map<string, DeliveryMetrics>();
    for (const r of rows) {
      map.set(r.restaurant_id, r);
    }
    return restaurantIds.map((id) => map.get(id) ?? null);
  }
}

export class RestaurantStatisticRepository extends BaseRepository {
  async findByRestaurantId(restaurantId: string): Promise<RestaurantStatistics | null> {
    const res = await query(
      `SELECT * FROM public.restaurant_statistics WHERE restaurant_id = $1 LIMIT 1`,
      [restaurantId]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<RestaurantStatistics>(res.rows[0] as Record<string, unknown>);
  }

  async findByRestaurantIds(
    restaurantIds: readonly string[]
  ): Promise<(RestaurantStatistics | null)[]> {
    if (restaurantIds.length === 0) return [];
    const res = await query(
      `SELECT * FROM public.restaurant_statistics WHERE restaurant_id = ANY($1::text[])`,
      [restaurantIds as string[]]
    );
    const rows = this.normalizeRows<RestaurantStatistics>(res.rows as Record<string, unknown>[]);
    const map = new Map<string, RestaurantStatistics>();
    for (const r of rows) {
      map.set(r.restaurant_id, r);
    }
    return restaurantIds.map((id) => map.get(id) ?? null);
  }
}

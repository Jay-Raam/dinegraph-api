import { query } from '../database/pool.js';
import { BaseRepository } from './base.repository.js';
import {
  Restaurant,
  RestaurantFilterInput,
  PaginationInput,
  PaginatedResult,
} from '../types/models.js';

export class RestaurantRepository extends BaseRepository {
  async findById(id: string): Promise<Restaurant | null> {
    const res = await query(
      `SELECT * FROM public.restaurants WHERE restaurant_id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<Restaurant>(res.rows[0] as Record<string, unknown>);
  }

  async findByIds(ids: readonly string[]): Promise<(Restaurant | null)[]> {
    if (ids.length === 0) return [];
    const res = await query(
      `SELECT * FROM public.restaurants WHERE restaurant_id = ANY($1::text[])`,
      [ids as string[]]
    );
    const map = new Map<string, Restaurant>();
    for (const row of res.rows) {
      const normalized = this.normalizeRow<Restaurant>(row as Record<string, unknown>);
      map.set(normalized.restaurant_id, normalized);
    }
    return ids.map((id) => map.get(id) ?? null);
  }

  async findMany(
    filter: RestaurantFilterInput = {},
    pagination: PaginationInput = { limit: 20, offset: 0 }
  ): Promise<PaginatedResult<Restaurant>> {
    const { limit, offset } = this.normalizePagination(pagination);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter.city) {
      conditions.push(`LOWER(city) = LOWER($${paramIndex++})`);
      params.push(filter.city);
    }
    if (filter.country) {
      conditions.push(`LOWER(country) = LOWER($${paramIndex++})`);
      params.push(filter.country);
    }
    if (filter.cuisine) {
      conditions.push(`LOWER(cuisine) = LOWER($${paramIndex++})`);
      params.push(filter.cuisine);
    }
    if (filter.minRating !== undefined) {
      conditions.push(`average_rating >= $${paramIndex++}`);
      params.push(filter.minRating);
    }
    if (filter.priceLevel !== undefined) {
      conditions.push(`price_level = $${paramIndex++}`);
      params.push(filter.priceLevel);
    }
    if (filter.deliveryAvailable !== undefined) {
      conditions.push(`delivery_available = $${paramIndex++}`);
      params.push(filter.deliveryAvailable);
    }
    if (filter.takeaway !== undefined) {
      conditions.push(`takeaway = $${paramIndex++}`);
      params.push(filter.takeaway);
    }
    if (filter.dineIn !== undefined) {
      conditions.push(`dine_in = $${paramIndex++}`);
      params.push(filter.dineIn);
    }
    if (filter.businessStatus) {
      conditions.push(`LOWER(business_status) = LOWER($${paramIndex++})`);
      params.push(filter.businessStatus);
    }
    if (filter.search) {
      conditions.push(`(
        restaurant_name ILIKE $${paramIndex} OR
        cuisine ILIKE $${paramIndex} OR
        city ILIKE $${paramIndex}
      )`);
      params.push(`%${filter.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countRes = await query(
      `SELECT COUNT(*) AS total FROM public.restaurants ${whereClause}`,
      params
    );
    const totalCount = parseInt(
      (countRes.rows[0] as { total?: string | number })?.total?.toString() || '0',
      10
    );

    // Data query with ordering
    const dataQuery = `
      SELECT * FROM public.restaurants
      ${whereClause}
      ORDER BY average_rating DESC NULLS LAST, review_count DESC NULLS LAST, restaurant_id ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const dataRes = await query(dataQuery, params);
    const items = this.normalizeRows<Restaurant>(
      dataRes.rows as Record<string, unknown>[]
    );

    return {
      items,
      totalCount,
      hasMore: offset + items.length < totalCount,
      limit,
      offset,
    };
  }

  async findByCity(city: string, country?: string): Promise<Restaurant[]> {
    const conditions = ['LOWER(city) = LOWER($1)'];
    const params: unknown[] = [city];
    if (country) {
      conditions.push('LOWER(country) = LOWER($2)');
      params.push(country);
    }
    const res = await query(
      `SELECT * FROM public.restaurants WHERE ${conditions.join(' AND ')} ORDER BY average_rating DESC NULLS LAST, restaurant_id ASC LIMIT 50`,
      params
    );
    return this.normalizeRows<Restaurant>(res.rows as Record<string, unknown>[]);
  }

  async findByCities(
    keys: readonly { city: string; country: string }[]
  ): Promise<Restaurant[][]> {
    if (keys.length === 0) return [];
    const locations = keys.map(
      (key) => `${key.city.toLowerCase()}__${key.country.toLowerCase()}`
    );
    const res = await query(
      `SELECT * FROM public.restaurants
      WHERE LOWER(city) || '__' || LOWER(country) = ANY($1::text[])
      ORDER BY average_rating DESC NULLS LAST, restaurant_id ASC`,
      [locations]
    );
    const rows = this.normalizeRows<Restaurant>(res.rows as Record<string, unknown>[]);
    const map = new Map<string, Restaurant[]>();
    for (const row of rows) {
      const key = `${row.city?.toLowerCase()}__${row.country?.toLowerCase()}`;
      const restaurants = map.get(key) ?? [];
      restaurants.push(row);
      map.set(key, restaurants);
    }
    return keys.map((key) => map.get(`${key.city.toLowerCase()}__${key.country.toLowerCase()}`) ?? []);
  }

  async create(data: Omit<Restaurant, 'average_rating' | 'review_count'>): Promise<Restaurant> {
    const res = await query(
      `INSERT INTO public.restaurants (
        restaurant_id, restaurant_name, chain_local, cuisine, latitude, longitude,
        city, country, opening_year, delivery_available, takeaway, dine_in, reservations,
        price_level, business_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        data.restaurant_id,
        data.restaurant_name,
        data.chain_local ?? null,
        data.cuisine ?? null,
        data.latitude ?? null,
        data.longitude ?? null,
        data.city ?? null,
        data.country ?? null,
        data.opening_year ?? null,
        data.delivery_available ?? false,
        data.takeaway ?? false,
        data.dine_in ?? true,
        data.reservations ?? false,
        data.price_level ?? null,
        data.business_status ?? 'OPERATIONAL',
      ]
    );
    return this.normalizeRow<Restaurant>(res.rows[0] as Record<string, unknown>);
  }

  async update(
    id: string,
    updates: Partial<Restaurant>
  ): Promise<Restaurant | null> {
    const columnMap: Record<string, string> = {
      restaurant_name: 'restaurant_name',
      chain_local: 'chain_local',
      cuisine: 'cuisine',
      latitude: 'latitude',
      longitude: 'longitude',
      city: 'city',
      country: 'country',
      opening_year: 'opening_year',
      delivery_available: 'delivery_available',
      takeaway: 'takeaway',
      dine_in: 'dine_in',
      reservations: 'reservations',
      price_level: 'price_level',
      average_rating: 'average_rating',
      review_count: 'review_count',
      business_status: 'business_status',
    };

    const setClauses: string[] = [];
    const params: unknown[] = [id];
    let index = 2;

    for (const [key, col] of Object.entries(columnMap)) {
      const val = (updates as Record<string, unknown>)[key];
      if (val !== undefined) {
        setClauses.push(`${col} = $${index++}`);
        params.push(val);
      }
    }

    if (setClauses.length === 0) return this.findById(id);

    const res = await query(
      `UPDATE public.restaurants SET ${setClauses.join(', ')} WHERE restaurant_id = $1 RETURNING *`,
      params
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<Restaurant>(res.rows[0] as Record<string, unknown>);
  }

  async delete(id: string): Promise<boolean> {
    const res = await query(
      `DELETE FROM public.restaurants WHERE restaurant_id = $1`,
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  }
}

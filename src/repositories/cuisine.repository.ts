import { query } from '../database/pool.js';
import { BaseRepository } from './base.repository.js';
import { Cuisine } from '../types/models.js';

export class CuisineRepository extends BaseRepository {
  async findAll(): Promise<Cuisine[]> {
    const res = await query(`SELECT * FROM public.cuisines ORDER BY cuisine_name ASC`);
    return this.normalizeRows<Cuisine>(res.rows as Record<string, unknown>[]);
  }

  async findById(id: string): Promise<Cuisine | null> {
    const res = await query(
      `SELECT * FROM public.cuisines WHERE cuisine_id = $1 LIMIT 1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<Cuisine>(res.rows[0] as Record<string, unknown>);
  }

  async findByName(name: string): Promise<Cuisine | null> {
    const res = await query(
      `SELECT * FROM public.cuisines WHERE LOWER(cuisine_name) = LOWER($1) LIMIT 1`,
      [name]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<Cuisine>(res.rows[0] as Record<string, unknown>);
  }
}

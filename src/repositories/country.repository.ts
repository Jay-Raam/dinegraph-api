import { query } from '../database/pool.js';
import { BaseRepository } from './base.repository.js';
import { Country } from '../types/models.js';

export class CountryRepository extends BaseRepository {
  async findAll(): Promise<Country[]> {
    const res = await query(`SELECT * FROM public.countries ORDER BY country ASC`);
    return this.normalizeRows<Country>(res.rows as Record<string, unknown>[]);
  }

  async findByName(country: string): Promise<Country | null> {
    const res = await query(
      `SELECT * FROM public.countries WHERE LOWER(country) = LOWER($1) LIMIT 1`,
      [country]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<Country>(res.rows[0] as Record<string, unknown>);
  }

  async findByNames(names: readonly string[]): Promise<(Country | null)[]> {
    if (names.length === 0) return [];
    const res = await query(
      `SELECT * FROM public.countries WHERE LOWER(country) = ANY($1::text[])`,
      [names.map((n) => n.toLowerCase())]
    );
    const rows = this.normalizeRows<Country>(res.rows as Record<string, unknown>[]);
    const map = new Map<string, Country>();
    for (const r of rows) {
      map.set(r.country.toLowerCase(), r);
    }
    return names.map((name) => map.get(name.toLowerCase()) ?? null);
  }
}

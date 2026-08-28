import { query } from '../database/pool.js';
import { BaseRepository } from './base.repository.js';
import { City, CityStatistics } from '../types/models.js';

export class CityRepository extends BaseRepository {
  async findAll(): Promise<City[]> {
    const res = await query(
      `SELECT * FROM public.cities ORDER BY population DESC NULLS LAST, city ASC, country ASC`
    );
    return this.normalizeRows<City>(res.rows as Record<string, unknown>[]);
  }

  async findByNameAndCountry(city: string, country: string): Promise<City | null> {
    const res = await query(
      `SELECT * FROM public.cities WHERE LOWER(city) = LOWER($1) AND LOWER(country) = LOWER($2) LIMIT 1`,
      [city, country]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<City>(res.rows[0] as Record<string, unknown>);
  }

  async findByLocations(
    keys: readonly { city: string; country: string }[]
  ): Promise<(City | null)[]> {
    if (keys.length === 0) return [];
    const locations = keys.map(
      (key) => `${key.city.toLowerCase()}__${key.country.toLowerCase()}`
    );
    const res = await query(
      `SELECT * FROM public.cities
       WHERE LOWER(city) || '__' || LOWER(country) = ANY($1::text[])`,
      [locations]
    );
    const rows = this.normalizeRows<City>(res.rows as Record<string, unknown>[]);
    const map = new Map<string, City>();
    for (const row of rows) {
      map.set(`${row.city.toLowerCase()}__${row.country.toLowerCase()}`, row);
    }
    return keys.map(
      (key) => map.get(`${key.city.toLowerCase()}__${key.country.toLowerCase()}`) ?? null
    );
  }

  async findByCountry(country: string): Promise<City[]> {
    const res = await query(
      `SELECT * FROM public.cities WHERE LOWER(country) = LOWER($1) ORDER BY population DESC NULLS LAST, city ASC`,
      [country]
    );
    return this.normalizeRows<City>(res.rows as Record<string, unknown>[]);
  }

  async findByCountries(countries: readonly string[]): Promise<City[][]> {
    if (countries.length === 0) return [];
    const normalizedCountries = countries.map((country) => country.toLowerCase());
    const res = await query(
      `SELECT * FROM public.cities WHERE LOWER(country) = ANY($1::text[]) ORDER BY population DESC NULLS LAST, city ASC`,
      [normalizedCountries]
    );
    const rows = this.normalizeRows<City>(res.rows as Record<string, unknown>[]);
    const map = new Map<string, City[]>();
    for (const row of rows) {
      const cities = map.get(row.country.toLowerCase()) ?? [];
      cities.push(row);
      map.set(row.country.toLowerCase(), cities);
    }
    return countries.map((country) => map.get(country.toLowerCase()) ?? []);
  }

  async findCityStatistics(city: string, country: string): Promise<CityStatistics | null> {
    const res = await query(
      `SELECT * FROM public.city_statistics WHERE LOWER(city) = LOWER($1) AND LOWER(country) = LOWER($2) LIMIT 1`,
      [city, country]
    );
    if (res.rows.length === 0) return null;
    return this.normalizeRow<CityStatistics>(res.rows[0] as Record<string, unknown>);
  }

  async findCityStatisticsBatch(
    keys: readonly { city: string; country: string }[]
  ): Promise<(CityStatistics | null)[]> {
    if (keys.length === 0) return [];
    const locations = keys.map(
      (key) => `${key.city.toLowerCase()}__${key.country.toLowerCase()}`
    );

    const res = await query(
      `SELECT * FROM public.city_statistics
       WHERE LOWER(city) || '__' || LOWER(country) = ANY($1::text[])`,
      [locations]
    );

    const rows = this.normalizeRows<CityStatistics>(res.rows as Record<string, unknown>[]);
    const map = new Map<string, CityStatistics>();
    for (const r of rows) {
      map.set(`${r.city.toLowerCase()}_${r.country.toLowerCase()}`, r);
    }

    return keys.map((k) => map.get(`${k.city.toLowerCase()}_${k.country.toLowerCase()}`) ?? null);
  }
}

import { query } from '../database/pool.js';
import { BaseRepository } from './base.repository.js';

export interface CuisineMarketShare {
  cuisine: string;
  restaurantCount: number;
  averageRating: number;
  averagePriceLevel: number;
}

export interface CityDiningOverview {
  city: string;
  country: string;
  totalRestaurants: number;
  avgRating: number;
  avgMenuPrice: number;
  avgDeliveryTime: number;
  fastestDeliveryTime: number;
}

export interface TopRankedDish {
  itemName: string;
  foodCategory: string;
  price: number;
  restaurantName: string;
  restaurantRating: number;
  city: string;
}

export class AnalyticsRepository extends BaseRepository {
  /**
   * Aggregates restaurant market distribution by cuisine.
   * Demonstrates GROUP BY, HAVING, and aggregate functions.
   */
  async getCuisineMarketShare(minRestaurants = 1): Promise<CuisineMarketShare[]> {
    const res = await query(
      `SELECT
        COALESCE(cuisine, 'Unknown') AS cuisine,
        COUNT(*)::int AS "restaurantCount",
        ROUND(AVG(average_rating)::numeric, 2)::float AS "averageRating",
        ROUND(AVG(price_level)::numeric, 2)::float AS "averagePriceLevel"
      FROM public.restaurants
      WHERE cuisine IS NOT NULL
      GROUP BY cuisine
      HAVING COUNT(*) >= $1
      ORDER BY "restaurantCount" DESC, "averageRating" DESC NULLS LAST
      LIMIT 20`,
      [minRestaurants]
    );

    return res.rows.map((row) => ({
      cuisine: (row as { cuisine: string }).cuisine,
      restaurantCount: Number((row as { restaurantCount: number }).restaurantCount),
      averageRating: Number((row as { averageRating: number }).averageRating || 0),
      averagePriceLevel: Number((row as { averagePriceLevel: number }).averagePriceLevel || 0),
    }));
  }

  /**
   * CTE (Common Table Expressions) and Multi-Table JOIN demonstration:
   * Aggregates city restaurant stats, delivery metrics, and menu prices.
   */
  async getCityDiningOverview(): Promise<CityDiningOverview[]> {
    const sql = `
      WITH city_aggregates AS (
        SELECT
          r.city,
          r.country,
          COUNT(DISTINCT r.restaurant_id)::int AS total_restaurants,
          ROUND(AVG(r.average_rating)::numeric, 2)::float AS avg_rating,
          ROUND(AVG(d.average_delivery_time)::numeric, 1)::float AS avg_delivery_time,
          MIN(d.estimated_delivery_time)::int AS fastest_delivery_time
        FROM public.restaurants r
        LEFT JOIN public.delivery_metrics d ON r.restaurant_id = d.restaurant_id
        WHERE r.city IS NOT NULL
        GROUP BY r.city, r.country
      ),
      city_menu_prices AS (
        SELECT
          r.city,
          r.country,
          ROUND(AVG(m.price)::numeric, 2)::float AS avg_menu_price
        FROM public.restaurants r
        JOIN public.menus m ON r.restaurant_id = m.restaurant_id
        WHERE r.city IS NOT NULL
        GROUP BY r.city, r.country
      )
      SELECT
        ca.city,
        ca.country,
        ca.total_restaurants AS "totalRestaurants",
        ca.avg_rating AS "avgRating",
        COALESCE(cmp.avg_menu_price, 0) AS "avgMenuPrice",
        COALESCE(ca.avg_delivery_time, 0) AS "avgDeliveryTime",
        COALESCE(ca.fastest_delivery_time, 0) AS "fastestDeliveryTime"
      FROM city_aggregates ca
      LEFT JOIN city_menu_prices cmp ON ca.city = cmp.city AND ca.country = cmp.country
      ORDER BY ca.total_restaurants DESC, ca.avg_rating DESC NULLS LAST
      LIMIT 20;
    `;

    const res = await query(sql);
    return res.rows.map((r) => ({
      city: String((r as Record<string, unknown>).city),
      country: String((r as Record<string, unknown>).country),
      totalRestaurants: Number((r as Record<string, unknown>).totalRestaurants || 0),
      avgRating: Number((r as Record<string, unknown>).avgRating || 0),
      avgMenuPrice: Number((r as Record<string, unknown>).avgMenuPrice || 0),
      avgDeliveryTime: Number((r as Record<string, unknown>).avgDeliveryTime || 0),
      fastestDeliveryTime: Number((r as Record<string, unknown>).fastestDeliveryTime || 0),
    }));
  }

  /**
   * Window function demonstration:
   * Rank dishes per category using DENSE_RANK() OVER (PARTITION BY ... ORDER BY ...)
   */
  async getTopDishesPerCategory(limitPerCategory = 3): Promise<TopRankedDish[]> {
    const sql = `
      WITH ranked_dishes AS (
        SELECT
          m.item_name,
          COALESCE(m.food_category, 'General') AS food_category,
          m.price,
          r.restaurant_name,
          r.average_rating,
          r.city,
          DENSE_RANK() OVER (
            PARTITION BY m.food_category
            ORDER BY r.average_rating DESC NULLS LAST, m.price ASC, m.menu_id ASC
          ) as category_rank
        FROM public.menus m
        JOIN public.restaurants r ON m.restaurant_id = r.restaurant_id
        WHERE m.food_category IS NOT NULL
      )
      SELECT
        item_name AS "itemName",
        food_category AS "foodCategory",
        price,
        restaurant_name AS "restaurantName",
        average_rating AS "restaurantRating",
        city
      FROM ranked_dishes
      WHERE category_rank <= $1
      ORDER BY food_category, category_rank
      LIMIT 50;
    `;

    const res = await query(sql, [limitPerCategory]);
    return res.rows.map((row) => ({
      itemName: String((row as Record<string, unknown>).itemName),
      foodCategory: String((row as Record<string, unknown>).foodCategory),
      price: Number((row as Record<string, unknown>).price),
      restaurantName: String((row as Record<string, unknown>).restaurantName),
      restaurantRating: Number((row as Record<string, unknown>).restaurantRating || 0),
      city: String((row as Record<string, unknown>).city),
    }));
  }
}

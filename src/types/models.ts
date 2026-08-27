export interface Country {
  country: string;
  region?: string | null;
  income_group?: string | null;
  currency?: string | null;
  timezone?: string | null;
  iso_code?: string | null;
}

export interface City {
  city: string;
  country: string;
  population?: number | null;
  area_km2?: number | null;
  urban_density?: number | null;
  tourism_index?: number | null;
  average_income?: number | null;
  cost_of_living_index?: number | null;
  weather_zone?: string | null;
}

export interface CityStatistics {
  city: string;
  country: string;
  restaurant_density?: number | null;
  cuisine_diversity_index?: number | null;
  average_rating?: number | null;
  average_menu_price?: number | null;
  delivery_coverage?: number | null;
}

export interface Cuisine {
  cuisine_id: string;
  cuisine_name: string;
  parent_cuisine?: string | null;
  region?: string | null;
}

export interface Restaurant {
  restaurant_id: string;
  restaurant_name: string;
  chain_local?: string | null;
  cuisine?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  country?: string | null;
  opening_year?: number | null;
  delivery_available?: boolean | null;
  takeaway?: boolean | null;
  dine_in?: boolean | null;
  reservations?: boolean | null;
  price_level?: number | null;
  average_rating?: number | null;
  review_count?: number | null;
  business_status?: string | null;
}

export interface RestaurantFeatures {
  restaurant_id: string;
  outdoor_seating?: boolean | null;
  wifi?: boolean | null;
  parking?: boolean | null;
  wheelchair_accessible?: boolean | null;
  pet_friendly?: boolean | null;
  kid_friendly?: boolean | null;
  vegetarian?: boolean | null;
  vegan?: boolean | null;
  halal?: boolean | null;
  alcohol?: boolean | null;
  drive_through?: boolean | null;
  hours_24?: boolean | null;
  live_music?: boolean | null;
}

export interface RestaurantStatistics {
  restaurant_id: string;
  average_menu_price?: number | null;
  most_common_cuisine?: string | null;
  average_delivery_time?: number | null;
  popularity_score?: number | null;
  estimated_value_score?: number | null;
}

export interface DeliveryMetrics {
  restaurant_id: string;
  delivery_fee?: number | null;
  service_fee?: number | null;
  packaging_fee?: number | null;
  estimated_delivery_time?: number | null;
  average_delivery_time?: number | null;
  peak_hour_multiplier?: number | null;
  minimum_order?: number | null;
  cancellation_rate?: number | null;
  availability?: boolean | null;
}

export interface Menu {
  menu_id: string;
  restaurant_id: string;
  food_category?: string | null;
  item_name: string;
  price?: number | null;
  currency?: string | null;
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbohydrates?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  vegetarian?: boolean | null;
  vegan?: boolean | null;
  gluten_free?: boolean | null;
}

export interface Nutrition {
  menu_id: string;
  item_name: string;
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbohydrates?: number | null;
  sugar?: number | null;
  sodium?: number | null;
  vegetarian?: boolean | null;
  vegan?: boolean | null;
  gluten_free?: boolean | null;
}

export interface PriceHistory {
  menu_id: string;
  timestamp: string | Date;
  current_price?: number | null;
  previous_price?: number | null;
  price_change?: number | null;
}

export interface PaginationInput {
  limit?: number;
  offset?: number;
}

export interface RestaurantFilterInput {
  city?: string;
  country?: string;
  cuisine?: string;
  minRating?: number;
  priceLevel?: number;
  deliveryAvailable?: boolean;
  takeaway?: boolean;
  dineIn?: boolean;
  businessStatus?: string;
  search?: string;
}

export interface MenuFilterInput {
  restaurantId?: string;
  foodCategory?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  maxPrice?: number;
  maxCalories?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

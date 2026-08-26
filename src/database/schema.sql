-- =============================================================================
-- PostgreSQL / Supabase Production Schema Definition
-- Dataset: Restaurant & Food Delivery Ecosystem
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. COUNTRIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.countries (
    country text NOT NULL PRIMARY KEY,
    region text,
    income_group text,
    currency text,
    timezone text,
    iso_code text
);

-- -----------------------------------------------------------------------------
-- 2. CITIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cities (
    city text NOT NULL,
    country text NOT NULL,
    population bigint,
    area_km2 double precision,
    urban_density bigint,
    tourism_index double precision,
    average_income bigint,
    cost_of_living_index bigint,
    weather_zone text,
    PRIMARY KEY (city, country),
    CONSTRAINT fk_cities_country FOREIGN KEY (country) REFERENCES public.countries(country) ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- 3. CITY STATISTICS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.city_statistics (
    city text NOT NULL,
    country text NOT NULL,
    restaurant_density double precision,
    cuisine_diversity_index double precision,
    average_rating double precision,
    average_menu_price double precision,
    delivery_coverage double precision,
    PRIMARY KEY (city, country),
    CONSTRAINT fk_city_stats_city FOREIGN KEY (city, country) REFERENCES public.cities(city, country) ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- 4. CUISINES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cuisines (
    cuisine_id text NOT NULL PRIMARY KEY,
    cuisine_name text NOT NULL,
    parent_cuisine text,
    region text
);

-- -----------------------------------------------------------------------------
-- 5. RESTAURANTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurants (
    restaurant_id text NOT NULL PRIMARY KEY,
    restaurant_name text NOT NULL,
    chain_local text,
    cuisine text,
    latitude double precision,
    longitude double precision,
    city text,
    country text,
    opening_year bigint,
    delivery_available boolean DEFAULT false,
    takeaway boolean DEFAULT false,
    dine_in boolean DEFAULT true,
    reservations boolean DEFAULT false,
    price_level bigint,
    average_rating double precision DEFAULT 0.0,
    review_count bigint DEFAULT 0,
    business_status text DEFAULT 'OPERATIONAL',
    CONSTRAINT fk_restaurants_country FOREIGN KEY (country) REFERENCES public.countries(country) ON DELETE SET NULL ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- 6. RESTAURANT FEATURES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_features (
    restaurant_id text NOT NULL PRIMARY KEY,
    outdoor_seating boolean DEFAULT false,
    wifi boolean DEFAULT false,
    parking boolean DEFAULT false,
    wheelchair_accessible boolean DEFAULT false,
    pet_friendly boolean DEFAULT false,
    kid_friendly boolean DEFAULT false,
    vegetarian boolean DEFAULT false,
    vegan boolean DEFAULT false,
    halal boolean DEFAULT false,
    alcohol boolean DEFAULT false,
    drive_through boolean DEFAULT false,
    "24_hours" boolean DEFAULT false,
    live_music boolean DEFAULT false,
    CONSTRAINT fk_features_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(restaurant_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 7. RESTAURANT STATISTICS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.restaurant_statistics (
    restaurant_id text NOT NULL PRIMARY KEY,
    average_menu_price double precision,
    most_common_cuisine text,
    average_delivery_time bigint,
    popularity_score double precision,
    estimated_value_score double precision,
    CONSTRAINT fk_stats_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(restaurant_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 8. DELIVERY METRICS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_metrics (
    restaurant_id text NOT NULL PRIMARY KEY,
    delivery_fee double precision DEFAULT 0.0,
    service_fee double precision DEFAULT 0.0,
    packaging_fee double precision DEFAULT 0.0,
    estimated_delivery_time bigint,
    average_delivery_time bigint,
    peak_hour_multiplier double precision DEFAULT 1.0,
    minimum_order double precision DEFAULT 0.0,
    cancellation_rate double precision DEFAULT 0.0,
    availability boolean DEFAULT true,
    CONSTRAINT fk_delivery_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(restaurant_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 9. MENUS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menus (
    menu_id text NOT NULL PRIMARY KEY,
    restaurant_id text NOT NULL,
    food_category text,
    item_name text NOT NULL,
    price double precision NOT NULL,
    currency text DEFAULT 'USD',
    calories bigint,
    protein double precision,
    fat double precision,
    carbohydrates double precision,
    sugar double precision,
    sodium double precision,
    vegetarian boolean DEFAULT false,
    vegan boolean DEFAULT false,
    gluten_free boolean DEFAULT false,
    CONSTRAINT fk_menus_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(restaurant_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 10. NUTRITION TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nutrition (
    menu_id text NOT NULL PRIMARY KEY,
    item_name text NOT NULL,
    calories bigint,
    protein double precision,
    fat double precision,
    carbohydrates double precision,
    sugar double precision,
    sodium double precision,
    vegetarian boolean DEFAULT false,
    vegan boolean DEFAULT false,
    gluten_free boolean DEFAULT false,
    CONSTRAINT fk_nutrition_menu FOREIGN KEY (menu_id) REFERENCES public.menus(menu_id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 11. PRICE HISTORY TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_history (
    id BIGSERIAL PRIMARY KEY,
    menu_id text NOT NULL,
    timestamp timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_price double precision NOT NULL,
    previous_price double precision,
    price_change double precision,
    CONSTRAINT fk_price_history_menu FOREIGN KEY (menu_id) REFERENCES public.menus(menu_id) ON DELETE CASCADE
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON public.restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_country ON public.restaurants(country);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine ON public.restaurants(cuisine);
CREATE INDEX IF NOT EXISTS idx_restaurants_rating ON public.restaurants(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_price_level ON public.restaurants(price_level);

CREATE INDEX IF NOT EXISTS idx_menus_restaurant_id ON public.menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menus_food_category ON public.menus(food_category);
CREATE INDEX IF NOT EXISTS idx_menus_price ON public.menus(price);

CREATE INDEX IF NOT EXISTS idx_price_history_menu_id ON public.price_history(menu_id);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON public.price_history(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_cities_country ON public.cities(country);

export const typeDefs = /* GraphQL */ `
  """
  ISO 8601 Timestamp Scalar
  """
  scalar DateTime

  # ---------------------------------------------------------------------------
  # Enums & Common Types
  # ---------------------------------------------------------------------------

  enum BusinessStatus {
    OPERATIONAL
    CLOSED_TEMPORARILY
    CLOSED_PERMANENTLY
  }

  input PaginationInput {
    limit: Int = 20
    offset: Int = 0
  }

  input RestaurantFilterInput {
    city: String
    country: String
    cuisine: String
    minRating: Float
    priceLevel: Int
    deliveryAvailable: Boolean
    takeaway: Boolean
    dineIn: Boolean
    businessStatus: String
    search: String
  }

  input MenuFilterInput {
    restaurantId: ID
    foodCategory: String
    isVegetarian: Boolean
    isVegan: Boolean
    isGlutenFree: Boolean
    maxPrice: Float
    maxCalories: Int
    search: String
  }

  input CreateRestaurantInput {
    restaurant_id: ID
    restaurant_name: String!
    chain_local: String
    cuisine: String
    latitude: Float
    longitude: Float
    city: String
    country: String
    opening_year: Int
    delivery_available: Boolean
    takeaway: Boolean
    dine_in: Boolean
    reservations: Boolean
    price_level: Int
    business_status: String
  }

  input UpdateRestaurantInput {
    restaurant_name: String
    chain_local: String
    cuisine: String
    latitude: Float
    longitude: Float
    city: String
    country: String
    opening_year: Int
    delivery_available: Boolean
    takeaway: Boolean
    dine_in: Boolean
    reservations: Boolean
    price_level: Int
    business_status: String
  }

  input CreateMenuItemInput {
    menu_id: ID
    restaurant_id: ID!
    food_category: String
    item_name: String!
    price: Float!
    currency: String = "USD"
    calories: Int
    protein: Float
    fat: Float
    carbohydrates: Float
    sugar: Float
    sodium: Float
    vegetarian: Boolean = false
    vegan: Boolean = false
    gluten_free: Boolean = false
  }

  # ---------------------------------------------------------------------------
  # Entity Types
  # ---------------------------------------------------------------------------

  type Country {
    country: String!
    region: String
    income_group: String
    currency: String
    timezone: String
    iso_code: String
    cities: [City!]!
  }

  type City {
    city: String!
    country: String!
    population: Float
    area_km2: Float
    urban_density: Float
    tourism_index: Float
    average_income: Float
    cost_of_living_index: Float
    weather_zone: String
    countryDetails: Country
    statistics: CityStatistics
    restaurants: [Restaurant!]!
  }

  type CityStatistics {
    city: String!
    country: String!
    restaurant_density: Float
    cuisine_diversity_index: Float
    average_rating: Float
    average_menu_price: Float
    delivery_coverage: Float
  }

  type Cuisine {
    cuisine_id: ID!
    cuisine_name: String!
    parent_cuisine: String
    region: String
  }

  type RestaurantFeatures {
    restaurant_id: ID!
    outdoor_seating: Boolean
    wifi: Boolean
    parking: Boolean
    wheelchair_accessible: Boolean
    pet_friendly: Boolean
    kid_friendly: Boolean
    vegetarian: Boolean
    vegan: Boolean
    halal: Boolean
    alcohol: Boolean
    drive_through: Boolean
    hours_24: Boolean
    live_music: Boolean
  }

  type RestaurantStatistics {
    restaurant_id: ID!
    average_menu_price: Float
    most_common_cuisine: String
    average_delivery_time: Int
    popularity_score: Float
    estimated_value_score: Float
  }

  type DeliveryMetrics {
    restaurant_id: ID!
    delivery_fee: Float
    service_fee: Float
    packaging_fee: Float
    estimated_delivery_time: Int
    average_delivery_time: Int
    peak_hour_multiplier: Float
    minimum_order: Float
    cancellation_rate: Float
    availability: Boolean
  }

  type Nutrition {
    menu_id: ID!
    item_name: String!
    calories: Int
    protein: Float
    fat: Float
    carbohydrates: Float
    sugar: Float
    sodium: Float
    vegetarian: Boolean
    vegan: Boolean
    gluten_free: Boolean
  }

  type PriceHistory {
    id: ID
    menu_id: ID!
    timestamp: String!
    current_price: Float!
    previous_price: Float
    price_change: Float
  }

  type Menu {
    menu_id: ID!
    restaurant_id: ID!
    food_category: String
    item_name: String!
    price: Float!
    currency: String
    calories: Int
    protein: Float
    fat: Float
    carbohydrates: Float
    sugar: Float
    sodium: Float
    vegetarian: Boolean
    vegan: Boolean
    gluten_free: Boolean
    restaurant: Restaurant
    nutrition: Nutrition
    priceHistory: [PriceHistory!]!
  }

  type Restaurant {
    restaurant_id: ID!
    restaurant_name: String!
    chain_local: String
    cuisine: String
    latitude: Float
    longitude: Float
    city: String
    country: String
    opening_year: Int
    delivery_available: Boolean
    takeaway: Boolean
    dine_in: Boolean
    reservations: Boolean
    price_level: Int
    average_rating: Float
    review_count: Int
    business_status: String
    countryDetails: Country
    cityDetails: City
    features: RestaurantFeatures
    statistics: RestaurantStatistics
    deliveryMetrics: DeliveryMetrics
    menus: [Menu!]!
  }

  # ---------------------------------------------------------------------------
  # Pagination & Analytics Output Types
  # ---------------------------------------------------------------------------

  type PaginatedRestaurants {
    items: [Restaurant!]!
    totalCount: Int!
    hasMore: Boolean!
    limit: Int!
    offset: Int!
  }

  type PaginatedMenus {
    items: [Menu!]!
    totalCount: Int!
    hasMore: Boolean!
    limit: Int!
    offset: Int!
  }

  type CuisineMarketShare {
    cuisine: String!
    restaurantCount: Int!
    averageRating: Float!
    averagePriceLevel: Float!
  }

  type CityDiningOverview {
    city: String!
    country: String!
    totalRestaurants: Int!
    avgRating: Float!
    avgMenuPrice: Float!
    avgDeliveryTime: Float!
    fastestDeliveryTime: Int!
  }

  type TopRankedDish {
    itemName: String!
    foodCategory: String!
    price: Float!
    restaurantName: String!
    restaurantRating: Float!
    city: String!
  }

  # ---------------------------------------------------------------------------
  # Root Queries & Mutations
  # ---------------------------------------------------------------------------

  type Query {
    # Restaurants
    restaurant(id: ID!): Restaurant
    restaurants(filter: RestaurantFilterInput, pagination: PaginationInput): PaginatedRestaurants!

    # Menus
    menu(id: ID!): Menu
    menus(filter: MenuFilterInput, pagination: PaginationInput): PaginatedMenus!

    # Locations & Geography
    countries: [Country!]!
    country(name: String!): Country
    cities: [City!]!
    city(name: String!, country: String!): City

    # Cuisines
    cuisines: [Cuisine!]!

    # Advanced PostgreSQL Analytics (Window Functions, CTEs, Aggregations)
    cuisineMarketShare(minRestaurants: Int = 1): [CuisineMarketShare!]!
    cityDiningOverview: [CityDiningOverview!]!
    topDishesPerCategory(limitPerCategory: Int = 3): [TopRankedDish!]!
  }

  type Mutation {
    createRestaurant(input: CreateRestaurantInput!): Restaurant!
    updateRestaurant(id: ID!, input: UpdateRestaurantInput!): Restaurant!
    deleteRestaurant(id: ID!): Boolean!

    createMenuItem(input: CreateMenuItemInput!): Menu!
  }
`;

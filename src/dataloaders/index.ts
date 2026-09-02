import DataLoader from 'dataloader';
import {
  Restaurant,
  RestaurantFeatures,
  RestaurantStatistics,
  DeliveryMetrics,
  Menu,
  Nutrition,
  PriceHistory,
  Country,
  City,
  CityStatistics,
} from '../types/models.js';
import { RestaurantRepository } from '../repositories/restaurant.repository.js';
import { RestaurantFeatureRepository } from '../repositories/feature.repository.js';
import {
  DeliveryMetricRepository,
  RestaurantStatisticRepository,
} from '../repositories/delivery.repository.js';
import { MenuRepository } from '../repositories/menu.repository.js';
import { CountryRepository } from '../repositories/country.repository.js';
import { CityRepository } from '../repositories/city.repository.js';

export interface DataLoaders {
  restaurantById: DataLoader<string, Restaurant | null>;
  menusByRestaurantId: DataLoader<string, Menu[]>;
  restaurantFeatures: DataLoader<string, RestaurantFeatures | null>;
  restaurantStats: DataLoader<string, RestaurantStatistics | null>;
  deliveryMetrics: DataLoader<string, DeliveryMetrics | null>;
  nutritionByMenuId: DataLoader<string, Nutrition | null>;
  priceHistoryByMenuId: DataLoader<string, PriceHistory[]>;
  countryByName: DataLoader<string, Country | null>;
  cityByLocation: DataLoader<{ city: string; country: string }, City | null, string>;
  citiesByCountry: DataLoader<string, City[]>;
  restaurantsByCity: DataLoader<{ city: string; country: string }, Restaurant[], string>;
  cityStatistics: DataLoader<{ city: string; country: string }, CityStatistics | null, string>;
}

export function createDataLoaders(repositories: {
  restaurantRepo: RestaurantRepository;
  featureRepo: RestaurantFeatureRepository;
  statsRepo: RestaurantStatisticRepository;
  deliveryRepo: DeliveryMetricRepository;
  menuRepo: MenuRepository;
  countryRepo: CountryRepository;
  cityRepo: CityRepository;
}): DataLoaders {
  const {
    restaurantRepo,
    featureRepo,
    statsRepo,
    deliveryRepo,
    menuRepo,
    countryRepo,
    cityRepo,
  } = repositories;

  return {
    restaurantById: new DataLoader<string, Restaurant | null>(async (ids) =>
      restaurantRepo.findByIds(ids)
    ),

    menusByRestaurantId: new DataLoader<string, Menu[]>(async (restaurantIds) =>
      menuRepo.findByRestaurantIds(restaurantIds)
    ),

    restaurantFeatures: new DataLoader<string, RestaurantFeatures | null>(async (restaurantIds) =>
      featureRepo.findByRestaurantIds(restaurantIds)
    ),

    restaurantStats: new DataLoader<string, RestaurantStatistics | null>(async (restaurantIds) =>
      statsRepo.findByRestaurantIds(restaurantIds)
    ),

    deliveryMetrics: new DataLoader<string, DeliveryMetrics | null>(async (restaurantIds) =>
      deliveryRepo.findByRestaurantIds(restaurantIds)
    ),

    nutritionByMenuId: new DataLoader<string, Nutrition | null>(async (menuIds) =>
      menuRepo.findNutritionBatch(menuIds)
    ),

    priceHistoryByMenuId: new DataLoader<string, PriceHistory[]>(async (menuIds) =>
      menuRepo.findPriceHistoryBatch(menuIds)
    ),

    countryByName: new DataLoader<string, Country | null>(async (names) =>
      countryRepo.findByNames(names)
    ),

    cityByLocation: new DataLoader<
      { city: string; country: string },
      City | null,
      string
    >(async (keys) => cityRepo.findByLocations(keys), {
      cacheKeyFn: (key) => `${key.city.toLowerCase()}__${key.country.toLowerCase()}`,
    }),

    citiesByCountry: new DataLoader<string, City[]>(async (countries) =>
      cityRepo.findByCountries(countries)
    ),

    restaurantsByCity: new DataLoader<
      { city: string; country: string },
      Restaurant[],
      string
    >(async (keys) => restaurantRepo.findByCities(keys), {
      cacheKeyFn: (key) => `${key.city.toLowerCase()}__${key.country.toLowerCase()}`,
    }),

    cityStatistics: new DataLoader<
      { city: string; country: string },
      CityStatistics | null,
      string
    >(
      async (keys) => cityRepo.findCityStatisticsBatch(keys),
      {
        cacheKeyFn: (key) => `${key.city.toLowerCase()}__${key.country.toLowerCase()}`,
      }
    ),
  };
}

import { GraphQLContext } from '../../types/context.js';
import {
  Restaurant,
  RestaurantFilterInput,
  PaginationInput,
} from '../../types/models.js';
import { requireRole } from '../../middleware/authorization.js';

export const restaurantResolvers = {
  Query: {
    restaurant: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      return ctx.services.restaurant.getRestaurantById(id);
    },

    restaurants: async (
      _: unknown,
      {
        filter,
        pagination,
      }: { filter?: RestaurantFilterInput; pagination?: PaginationInput },
      ctx: GraphQLContext
    ) => {
      return ctx.services.restaurant.getRestaurants(filter, pagination);
    },
  },

  Mutation: {
    createRestaurant: async (
      _: unknown,
      { input }: { input: Omit<Restaurant, 'average_rating' | 'review_count'> },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx.user, 'admin');
      return ctx.services.restaurant.createRestaurant(input);
    },

    updateRestaurant: async (
      _: unknown,
      { id, input }: { id: string; input: Partial<Restaurant> },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx.user, 'admin');
      return ctx.services.restaurant.updateRestaurant(id, input);
    },

    deleteRestaurant: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx.user, 'admin');
      return ctx.services.restaurant.deleteRestaurant(id);
    },
  },

  Restaurant: {
    countryDetails: async (parent: Restaurant, _: unknown, ctx: GraphQLContext) => {
      if (!parent.country) return null;
      return ctx.loaders.countryByName.load(parent.country);
    },

    cityDetails: async (parent: Restaurant, _: unknown, ctx: GraphQLContext) => {
      if (!parent.city || !parent.country) return null;
      return ctx.loaders.cityByLocation.load({
        city: parent.city,
        country: parent.country,
      });
    },

    features: async (parent: Restaurant, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.restaurantFeatures.load(parent.restaurant_id);
    },

    statistics: async (parent: Restaurant, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.restaurantStats.load(parent.restaurant_id);
    },

    deliveryMetrics: async (parent: Restaurant, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.deliveryMetrics.load(parent.restaurant_id);
    },

    menus: async (parent: Restaurant, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.menusByRestaurantId.load(parent.restaurant_id);
    },
  },
};

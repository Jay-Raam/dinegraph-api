import { GraphQLContext } from '../../types/context.js';
import { ValidationError } from '../../errors/AppError.js';

function validatePositiveInteger(value: number, field: string, max: number): number {
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new ValidationError(`${field} must be an integer between 1 and ${max}`);
  }
  return value;
}

export const analyticsResolvers = {
  Query: {
    cuisines: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      return ctx.services.analytics.getAllCuisines();
    },

    cuisineMarketShare: async (
      _: unknown,
      { minRestaurants }: { minRestaurants?: number },
      ctx: GraphQLContext
    ) => {
      return ctx.services.analytics.getCuisineMarketShare(
        validatePositiveInteger(minRestaurants ?? 1, 'minRestaurants', 1000)
      );
    },

    cityDiningOverview: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      return ctx.services.analytics.getCityDiningOverview();
    },

    topDishesPerCategory: async (
      _: unknown,
      { limitPerCategory }: { limitPerCategory?: number },
      ctx: GraphQLContext
    ) => {
      return ctx.services.analytics.getTopDishesPerCategory(
        validatePositiveInteger(limitPerCategory ?? 3, 'limitPerCategory', 50)
      );
    },
  },
};

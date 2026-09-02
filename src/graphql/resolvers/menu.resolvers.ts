import { GraphQLContext } from '../../types/context.js';
import {
  Menu,
  MenuFilterInput,
  PaginationInput,
} from '../../types/models.js';
import { requireRole } from '../../middleware/authorization.js';

export const menuResolvers = {
  Query: {
    menu: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext
    ) => {
      return ctx.services.menu.getMenuById(id);
    },

    menus: async (
      _: unknown,
      {
        filter,
        pagination,
      }: { filter?: MenuFilterInput; pagination?: PaginationInput },
      ctx: GraphQLContext
    ) => {
      return ctx.services.menu.getMenus(filter, pagination);
    },
  },

  Mutation: {
    createMenuItem: async (
      _: unknown,
      { input }: { input: Parameters<GraphQLContext['services']['menu']['createMenuItem']>[0] },
      ctx: GraphQLContext
    ) => {
      requireRole(ctx.user, 'admin');
      return ctx.services.menu.createMenuItem(input);
    },
  },

  Menu: {
    restaurant: async (parent: Menu, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.restaurantById.load(parent.restaurant_id);
    },

    nutrition: async (parent: Menu, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.nutritionByMenuId.load(parent.menu_id);
    },

    priceHistory: async (parent: Menu, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.priceHistoryByMenuId.load(parent.menu_id);
    },
  },
};

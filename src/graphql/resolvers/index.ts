import { restaurantResolvers } from './restaurant.resolvers.js';
import { cityResolvers } from './city.resolvers.js';
import { menuResolvers } from './menu.resolvers.js';
import { analyticsResolvers } from './analytics.resolvers.js';

export const resolvers = {
  Query: {
    ...restaurantResolvers.Query,
    ...cityResolvers.Query,
    ...menuResolvers.Query,
    ...analyticsResolvers.Query,
  },

  Mutation: {
    ...restaurantResolvers.Mutation,
    ...menuResolvers.Mutation,
  },

  Restaurant: restaurantResolvers.Restaurant,
  City: cityResolvers.City,
  Country: cityResolvers.Country,
  Menu: menuResolvers.Menu,
};

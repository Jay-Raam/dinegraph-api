import { GraphQLContext } from '../../types/context.js';
import { City, Country } from '../../types/models.js';

export const cityResolvers = {
  Query: {
    cities: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      return ctx.services.city.getAllCities();
    },

    city: async (
      _: unknown,
      { name, country }: { name: string; country: string },
      ctx: GraphQLContext
    ) => {
      return ctx.services.city.getCity(name, country);
    },

    countries: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      return ctx.services.city.getAllCountries();
    },

    country: async (
      _: unknown,
      { name }: { name: string },
      ctx: GraphQLContext
    ) => {
      return ctx.services.city.getCountry(name);
    },
  },

  City: {
    countryDetails: async (parent: City, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.countryByName.load(parent.country);
    },

    statistics: async (parent: City, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.cityStatistics.load({
        city: parent.city,
        country: parent.country,
      });
    },

    restaurants: async (parent: City, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.restaurantsByCity.load({
        city: parent.city,
        country: parent.country,
      });
    },
  },

  Country: {
    cities: async (parent: Country, _: unknown, ctx: GraphQLContext) => {
      return ctx.loaders.citiesByCountry.load(parent.country);
    },
  },
};

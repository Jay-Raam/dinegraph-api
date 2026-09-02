import { createSchema } from 'graphql-yoga';
import { typeDefs } from './typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { GraphQLContext } from '../types/context.js';

export const schema = createSchema<GraphQLContext>({
  typeDefs,
  resolvers,
});

import { DocumentNode } from 'graphql';
import { c as RequestHandlerOptions, a as ResponseResolver } from './HttpResponse-Gtw1lt3H.mjs';
import { a as GraphQLQuery, b as GraphQLVariables, e as GraphQLHandlerNameSelector, G as GraphQLHandler, f as GraphQLResolverExtras, g as GraphQLResponseBody } from './GraphQLHandler-5pZBHLn9.mjs';
import { Path } from './utils/matching/matchRequestUrl.mjs';
import './utils/internal/isIterable.mjs';
import './typeUtils.mjs';

interface TypedDocumentNode<Result = {
    [key: string]: any;
}, Variables = {
    [key: string]: any;
}> extends DocumentNode {
    __apiType?: (variables: Variables) => Result;
    __resultType?: Result;
    __variablesType?: Variables;
}
type GraphQLRequestHandler = <Query extends GraphQLQuery = GraphQLQuery, Variables extends GraphQLVariables = GraphQLVariables>(operationName: GraphQLHandlerNameSelector | DocumentNode | TypedDocumentNode<Query, Variables>, resolver: GraphQLResponseResolver<[
    Query
] extends [never] ? GraphQLQuery : Query, Variables>, options?: RequestHandlerOptions) => GraphQLHandler;
type GraphQLResponseResolver<Query extends GraphQLQuery = GraphQLQuery, Variables extends GraphQLVariables = GraphQLVariables> = ResponseResolver<GraphQLResolverExtras<Variables>, null, GraphQLResponseBody<[Query] extends [never] ? GraphQLQuery : Query>>;
declare const standardGraphQLHandlers: {
    /**
     * Intercepts a GraphQL query by a given name.
     *
     * @example
     * graphql.query('GetUser', () => {
     *   return HttpResponse.json({ data: { user: { name: 'John' } } })
     * })
     *
     * @see {@link https://mswjs.io/docs/api/graphql#graphqlqueryqueryname-resolver `graphql.query()` API reference}
     */
    query: GraphQLRequestHandler;
    /**
     * Intercepts a GraphQL mutation by its name.
     *
     * @example
     * graphql.mutation('SavePost', () => {
     *   return HttpResponse.json({ data: { post: { id: 'abc-123 } } })
     * })
     *
     * @see {@link https://mswjs.io/docs/api/graphql#graphqlmutationmutationname-resolver `graphql.query()` API reference}
     *
     */
    mutation: GraphQLRequestHandler;
    /**
     * Intercepts any GraphQL operation, regardless of its type or name.
     *
     * @example
     * graphql.operation(() => {
     *   return HttpResponse.json({ data: { name: 'John' } })
     * })
     *
     * @see {@link https://mswjs.io/docs/api/graphql#graphloperationresolver `graphql.operation()` API reference}
     */
    operation: <Query extends GraphQLQuery = GraphQLQuery, Variables extends GraphQLVariables = GraphQLVariables>(resolver: ResponseResolver<GraphQLResolverExtras<Variables>, null, GraphQLResponseBody<Query>>) => GraphQLHandler;
};
declare function createGraphQLLink(url: Path): typeof standardGraphQLHandlers;
/**
 * A namespace to intercept and mock GraphQL operations
 *
 * @example
 * graphql.query('GetUser', resolver)
 * graphql.mutation('DeletePost', resolver)
 *
 * @see {@link https://mswjs.io/docs/api/graphql `graphql` API reference}
 */
declare const graphql: {
    /**
     * Intercepts GraphQL operations scoped by the given URL.
     *
     * @example
     * const github = graphql.link('https://api.github.com/graphql')
     * github.query('GetRepo', resolver)
     *
     * @see {@link https://mswjs.io/docs/api/graphql#graphqllinkurl `graphql.link()` API reference}
     */
    link: typeof createGraphQLLink;
    /**
     * Intercepts a GraphQL query by a given name.
     *
     * @example
     * graphql.query('GetUser', () => {
     *   return HttpResponse.json({ data: { user: { name: 'John' } } })
     * })
     *
     * @see {@link https://mswjs.io/docs/api/graphql#graphqlqueryqueryname-resolver `graphql.query()` API reference}
     */
    query: GraphQLRequestHandler;
    /**
     * Intercepts a GraphQL mutation by its name.
     *
     * @example
     * graphql.mutation('SavePost', () => {
     *   return HttpResponse.json({ data: { post: { id: 'abc-123 } } })
     * })
     *
     * @see {@link https://mswjs.io/docs/api/graphql#graphqlmutationmutationname-resolver `graphql.query()` API reference}
     *
     */
    mutation: GraphQLRequestHandler;
    /**
     * Intercepts any GraphQL operation, regardless of its type or name.
     *
     * @example
     * graphql.operation(() => {
     *   return HttpResponse.json({ data: { name: 'John' } })
     * })
     *
     * @see {@link https://mswjs.io/docs/api/graphql#graphloperationresolver `graphql.operation()` API reference}
     */
    operation: <Query extends GraphQLQuery = GraphQLQuery, Variables extends GraphQLVariables = GraphQLVariables>(resolver: ResponseResolver<GraphQLResolverExtras<Variables>, null, GraphQLResponseBody<Query>>) => GraphQLHandler;
};

export { type GraphQLRequestHandler, type GraphQLResponseResolver, type TypedDocumentNode, graphql };

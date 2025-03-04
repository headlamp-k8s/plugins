import { OperationTypeNode, DocumentNode, GraphQLError } from 'graphql';
import { g as RequestHandlerDefaultInfo, D as DefaultBodyType, R as RequestHandler, a as ResponseResolver, c as RequestHandlerOptions } from './HttpResponse-Gtw1lt3H.mjs';
import { Match, Path } from './utils/matching/matchRequestUrl.mjs';

interface ParsedGraphQLQuery {
    operationType: OperationTypeNode;
    operationName?: string;
}
type ParsedGraphQLRequest<VariablesType extends GraphQLVariables = GraphQLVariables> = (ParsedGraphQLQuery & {
    query: string;
    variables?: VariablesType;
}) | undefined;
declare function parseDocumentNode(node: DocumentNode): ParsedGraphQLQuery;
type GraphQLParsedOperationsMap = Record<string, string[]>;
type GraphQLMultipartRequestBody = {
    operations: string;
    map?: string;
} & {
    [fileName: string]: File;
};
/**
 * Determines if a given request can be considered a GraphQL request.
 * Does not parse the query and does not guarantee its validity.
 */
declare function parseGraphQLRequest(request: Request): Promise<ParsedGraphQLRequest>;

type ExpectedOperationTypeNode = OperationTypeNode | 'all';
type GraphQLHandlerNameSelector = DocumentNode | RegExp | string;
type GraphQLQuery = Record<string, any>;
type GraphQLVariables = Record<string, any>;
interface GraphQLHandlerInfo extends RequestHandlerDefaultInfo {
    operationType: ExpectedOperationTypeNode;
    operationName: GraphQLHandlerNameSelector;
}
type GraphQLRequestParsedResult = {
    match: Match;
    cookies: Record<string, string>;
} & (ParsedGraphQLRequest<GraphQLVariables>
/**
 * An empty version of the ParsedGraphQLRequest
 * which simplifies the return type of the resolver
 * when the request is to a non-matching endpoint
 */
 | {
    operationType?: undefined;
    operationName?: undefined;
    query?: undefined;
    variables?: undefined;
});
type GraphQLResolverExtras<Variables extends GraphQLVariables> = {
    query: string;
    operationName: string;
    variables: Variables;
    cookies: Record<string, string>;
};
type GraphQLRequestBody<VariablesType extends GraphQLVariables> = GraphQLJsonRequestBody<VariablesType> | GraphQLMultipartRequestBody | Record<string, any> | undefined;
interface GraphQLJsonRequestBody<Variables extends GraphQLVariables> {
    query: string;
    variables?: Variables;
}
type GraphQLResponseBody<BodyType extends DefaultBodyType> = {
    data?: BodyType | null;
    errors?: readonly Partial<GraphQLError>[] | null;
} | null | undefined;
declare function isDocumentNode(value: DocumentNode | any): value is DocumentNode;
declare class GraphQLHandler extends RequestHandler<GraphQLHandlerInfo, GraphQLRequestParsedResult, GraphQLResolverExtras<any>> {
    private endpoint;
    static parsedRequestCache: WeakMap<Request, ParsedGraphQLRequest<GraphQLVariables>>;
    constructor(operationType: ExpectedOperationTypeNode, operationName: GraphQLHandlerNameSelector, endpoint: Path, resolver: ResponseResolver<GraphQLResolverExtras<any>, any, any>, options?: RequestHandlerOptions);
    /**
     * Parses the request body, once per request, cached across all
     * GraphQL handlers. This is done to avoid multiple parsing of the
     * request body, which each requires a clone of the request.
     */
    parseGraphQLRequestOrGetFromCache(request: Request): Promise<ParsedGraphQLRequest<GraphQLVariables>>;
    parse(args: {
        request: Request;
    }): Promise<GraphQLRequestParsedResult>;
    predicate(args: {
        request: Request;
        parsedResult: GraphQLRequestParsedResult;
    }): boolean;
    protected extendResolverArgs(args: {
        request: Request;
        parsedResult: GraphQLRequestParsedResult;
    }): {
        query: string;
        operationName: string;
        variables: GraphQLVariables;
        cookies: Record<string, string>;
    };
    log(args: {
        request: Request;
        response: Response;
        parsedResult: GraphQLRequestParsedResult;
    }): Promise<void>;
}

export { type ExpectedOperationTypeNode as E, GraphQLHandler as G, type ParsedGraphQLRequest as P, type GraphQLQuery as a, type GraphQLVariables as b, type GraphQLRequestBody as c, type GraphQLJsonRequestBody as d, type GraphQLHandlerNameSelector as e, type GraphQLResolverExtras as f, type GraphQLResponseBody as g, type ParsedGraphQLQuery as h, type GraphQLParsedOperationsMap as i, type GraphQLMultipartRequestBody as j, parseGraphQLRequest as k, type GraphQLHandlerInfo as l, type GraphQLRequestParsedResult as m, isDocumentNode as n, parseDocumentNode as p };

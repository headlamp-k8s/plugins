export declare class CronParser {
    expression: string;
    dayOfWeekStartIndexZero: boolean;
    monthStartIndexZero: boolean;
    constructor(expression: string, dayOfWeekStartIndexZero?: boolean, monthStartIndexZero?: boolean);
    parse(): string[];
    parseSpecial(expression: string): string;
    protected extractParts(expression: string): string[];
    protected normalize(expressionParts: string[]): void;
    protected validate(parsed: string[]): void;
    protected validateAnyRanges(parsed: string[]): void;
    protected validateOnlyExpectedCharactersFound(cronPart: string, allowedCharsExpression: string): void;
}

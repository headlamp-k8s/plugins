import { Options } from "./options";
import { Locale } from "./i18n/locale";
import { LocaleLoader } from "./i18n/localeLoader";
export declare class ExpressionDescriptor {
    static locales: {
        [name: string]: Locale;
    };
    static defaultLocale: string;
    static specialCharacters: string[];
    expression: string;
    expressionParts: string[];
    options: Options;
    i18n: Locale;
    static toString(expression: string, { throwExceptionOnParseError, verbose, dayOfWeekStartIndexZero, monthStartIndexZero, use24HourTimeFormat, locale, tzOffset, }?: Options): string;
    static initialize(localesLoader: LocaleLoader, defaultLocale?: string): void;
    constructor(expression: string, options: Options);
    protected getFullDescription(): string;
    protected getTimeOfDayDescription(): string;
    protected getSecondsDescription(): string;
    protected getMinutesDescription(): string;
    protected getHoursDescription(): string;
    protected getDayOfWeekDescription(): string;
    protected getMonthDescription(): string;
    protected getDayOfMonthDescription(): string | null;
    protected getYearDescription(): string;
    protected getSegmentDescription(expression: string, allDescription: string, getSingleItemDescription: (t: string, form?: number) => string, getIncrementDescriptionFormat: (t: string) => string, getRangeDescriptionFormat: (t: string) => string, getDescriptionFormat: (t: string) => string): string | null;
    protected generateRangeSegmentDescription(rangeExpression: string, getRangeDescriptionFormat: (t: string) => string, getSingleItemDescription: (t: string, form?: number) => string): string;
    protected formatTime(hourExpression: string, minuteExpression: string, secondExpression: string): string;
    protected transformVerbosity(description: string, useVerboseFormat: boolean): string;
    private getPeriod;
}

declare namespace HighlightWords {
    interface Chunk {
        key: string;
        text: string;
        match: boolean;
    }
    interface Options {
        text: string;
        query: string;
        clipBy?: number;
        matchExactly?: boolean;
    }
    interface Clip {
        curr: Chunk;
        next?: Chunk;
        prev?: Chunk;
        clipBy?: number;
    }
    interface Query {
        terms: string;
        matchExactly?: boolean;
    }
}

/**
 * Split a text into chunks denoting which are a match and which are not based on a user search term.
 * @param text          String  The text to split.
 * @param query         String  The query to split by. This can contain multiple words.
 * @param clipBy        Number  Clip the non-matches by a certain number of words to provide context around the matches.
 * @param matchExactly  Boolean If we have multiple words in the query, we will match any of the words if exact is false. For example, searching for "brown fox" in "the brown cute fox" will yield both "brown" and "fox" as matches. While if exact is true, the same search will return no results.
 */
declare const highlightWords: ({ text, query, clipBy, matchExactly }: Readonly<HighlightWords.Options>) => HighlightWords.Chunk[];

export { HighlightWords, highlightWords as default };

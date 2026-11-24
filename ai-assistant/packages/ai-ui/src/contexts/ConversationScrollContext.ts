import { createContext } from 'react';

/** Lets content navigation take control of the enclosing conversation scroller. */
export const ConversationScrollContext = createContext<(() => void) | null>(null);

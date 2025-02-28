import { CoordinateExtent, HandleType } from './types';
export declare const errorMessages: {
    error001: () => string;
    error002: () => string;
    error003: (nodeType: string) => string;
    error004: () => string;
    error005: () => string;
    error006: () => string;
    error007: (id: string) => string;
    error009: (type: string) => string;
    error008: (handleType: HandleType, { id, sourceHandle, targetHandle }: {
        id: string;
        sourceHandle: string | null;
        targetHandle: string | null;
    }) => string;
    error010: () => string;
    error011: (edgeType: string) => string;
    error012: (id: string) => string;
    error013: (lib?: string) => string;
    error014: () => string;
    error015: () => string;
};
export declare const infiniteExtent: CoordinateExtent;
export declare const elementSelectionKeys: string[];
//# sourceMappingURL=constants.d.ts.map
export default function useRecordHotkeys(): readonly [Set<string>, {
    readonly start: () => void;
    readonly stop: () => void;
    readonly resetKeys: () => void;
    readonly isRecording: boolean;
}];

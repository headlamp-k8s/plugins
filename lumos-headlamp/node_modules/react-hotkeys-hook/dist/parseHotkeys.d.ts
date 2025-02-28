import { Hotkey } from './types';
export declare function mapKey(key?: string): string;
export declare function isHotkeyModifier(key: string): boolean;
export declare function parseKeysHookInput(keys: string, splitKey?: string): string[];
export declare function parseHotkey(hotkey: string, combinationKey?: string, description?: string): Hotkey;

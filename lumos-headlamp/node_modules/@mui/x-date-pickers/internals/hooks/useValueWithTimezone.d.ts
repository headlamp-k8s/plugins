import type { PickerValueManager } from './usePicker';
import { PickersTimezone, PickerValidDate } from '../../models';
/**
 * Hooks making sure that:
 * - The value returned by `onChange` always have the timezone of `props.value` or `props.defaultValue` if defined
 * - The value rendered is always the one from `props.timezone` if defined
 */
export declare const useValueWithTimezone: <TValue, TDate extends PickerValidDate, TChange extends (...params: any[]) => void>({ timezone: timezoneProp, value: valueProp, defaultValue, referenceDate, onChange, valueManager, }: UseValueWithTimezoneParameters<TValue, TDate, TChange>) => {
    value: TValue;
    handleValueChange: TChange;
    timezone: string;
};
/**
 * Wrapper around `useControlled` and `useValueWithTimezone`
 */
export declare const useControlledValueWithTimezone: <TValue, TDate extends PickerValidDate, TChange extends (...params: any[]) => void>({ name, timezone: timezoneProp, value: valueProp, defaultValue, referenceDate, onChange: onChangeProp, valueManager, }: UseControlledValueWithTimezoneParameters<TValue, TDate, TChange>) => {
    value: TValue;
    handleValueChange: TChange;
    timezone: string;
};
interface UseValueWithTimezoneParameters<TValue, TDate extends PickerValidDate, TChange extends (...params: any[]) => void> {
    timezone: PickersTimezone | undefined;
    value: TValue | undefined;
    defaultValue: TValue | undefined;
    /**
     * The reference date as passed to `props.referenceDate`.
     * It does not need to have its default value.
     * This is only used to determine the timezone to use when `props.value` and `props.defaultValue` are not defined.
     */
    referenceDate: TDate | undefined;
    onChange: TChange | undefined;
    valueManager: PickerValueManager<TValue, TDate, any>;
}
interface UseControlledValueWithTimezoneParameters<TValue, TDate extends PickerValidDate, TChange extends (...params: any[]) => void> extends UseValueWithTimezoneParameters<TValue, TDate, TChange> {
    name: string;
}
export {};

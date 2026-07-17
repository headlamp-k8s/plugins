import { Hardware } from '../../resources/hardware';
import { fallback, getFirstDefined } from '../common/listHelpers';

/**
 * Gets the best machine identifier available on a Hardware object.
 *
 * @param item - Hardware resource to inspect.
 * @returns Agent, instance, or interface identifier.
 */
export function getHardwareAgentID(item: Hardware): string {
  return fallback(
    getFirstDefined(
      item.spec?.agentID,
      item.spec?.metadata?.instance?.id,
      item.spec?.interfaces?.[0]?.dhcp?.mac
    )
  );
}

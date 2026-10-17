/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Destination, KReference } from './common';
import type { KnativeTrigger, TriggerFilter } from './trigger';

const BROKER_CLASS_ANNOTATION = 'eventing.knative.dev/broker.class';

/**
 * Reads a Broker's class from its annotations.
 *
 * @param metadata - The Broker's metadata.
 * @returns The value of the `eventing.knative.dev/broker.class` annotation, or undefined when it
 * is not set.
 */
export function getBrokerClass(metadata: {
  /** Annotations of the Broker. */
  annotations?: Record<string, string>;
}): string | undefined {
  return metadata.annotations?.[BROKER_CLASS_ANNOTATION];
}

/**
 * Finds the Broker a Trigger takes events from, which it names in `spec.broker` or
 * `spec.brokerRef`.
 *
 * @param spec - The Trigger's spec, if it has one.
 * @returns The Broker's name, with the namespace that `spec.brokerRef` names, if any; undefined
 * when the Trigger names no Broker.
 */
export function getTriggerBroker(spec?: {
  /** Name of the Broker in the Trigger's namespace. */
  broker?: string;
  /** Reference to the Broker, which may be in another namespace. */
  brokerRef?: KReference;
}): { name: string; namespace?: string } | undefined {
  if (spec?.broker) {
    return { name: spec.broker };
  }

  return spec?.brokerRef?.name
    ? { name: spec.brokerRef.name, namespace: spec.brokerRef.namespace }
    : undefined;
}

/**
 * Formats a destination, such as a Trigger's or Subscription's subscriber, for display.
 *
 * @param destination - The destination, if there is one.
 * @returns `Kind/name` for an object reference (or whichever of the two is set), the URI on its
 * own, `Kind/name (uri)` when both are set, and an empty string when there is neither.
 */
export function formatDestination(destination?: Destination): string {
  if (!destination) {
    return '';
  }

  const ref = destination.ref;
  const target = ref ? [ref.kind, ref.name].filter(Boolean).join('/') : '';
  if (!target) {
    return destination.uri || '';
  }

  return destination.uri ? `${target} (${destination.uri})` : target;
}

/**
 * Formats attribute conditions, for example `type = order.created`.
 *
 * @param attributes - Attribute names and the values they are compared with.
 * @param operator - What goes between an attribute and its value.
 * @returns One condition per attribute, or none when a name or value is empty, because Knative
 * then ignores the whole expression.
 */
function formatAttributes(
  attributes: Record<string, string> | undefined,
  operator: string
): string[] {
  const entries = Object.entries(attributes ?? {});
  if (entries.some(([key, value]) => !key || !value)) {
    return [];
  }
  return entries.map(([key, value]) => `${key} ${operator} ${value}`);
}

/** When an expression holds: `true` for always, `false` for never, or a condition to show. */
type FilterCondition = boolean | string;

/**
 * How Knative's broker evaluates one filter expression. An expression passes, rejects the event or
 * decides nothing, and the broker delivers every event that the filters do not reject.
 */
interface FilterOutcome {
  /** When the expression passes. */
  passes: FilterCondition;
  /** When the expression does not reject the event. */
  delivers: FilterCondition;
}

const UNDECIDED: FilterOutcome = { passes: false, delivers: true };

/**
 * Lists the conditions that are written out, leaving out `true`, `false` and repeats.
 *
 * @param conditions - The conditions to list.
 * @returns The distinct written conditions, in order.
 */
function writtenConditions(conditions: FilterCondition[]): string[] {
  const parts = conditions.filter(
    (condition): condition is string => typeof condition === 'string'
  );
  return Array.from(new Set(parts));
}

/**
 * Combines conditions that must all hold.
 *
 * @param conditions - The conditions to combine.
 * @param join - Formats two or more conditions as one.
 * @returns `false` when one never holds; otherwise `true` when all always hold, the only condition
 * left, or the conditions joined by `join`.
 */
function allHold(
  conditions: FilterCondition[],
  join: (parts: string[]) => string
): FilterCondition {
  if (conditions.includes(false)) {
    return false;
  }
  const parts = writtenConditions(conditions);
  if (parts.length === 0) {
    return true;
  }
  return parts.length === 1 ? parts[0] : join(parts);
}

/**
 * Combines conditions of which at least one must hold.
 *
 * @param conditions - The conditions to combine.
 * @returns `true` when one always holds; otherwise `false` when none can hold, the only condition
 * left, or `any of (...)`.
 */
function anyHolds(conditions: FilterCondition[]): FilterCondition {
  if (conditions.includes(true)) {
    return true;
  }
  const parts = writtenConditions(conditions);
  if (parts.length === 0) {
    return false;
  }
  return parts.length === 1 ? parts[0] : `any of (${parts.join('; ')})`;
}

/**
 * Negates a condition.
 *
 * @param condition - The condition to negate.
 * @returns The opposite condition.
 */
function negate(condition: FilterCondition): FilterCondition {
  return typeof condition === 'boolean' ? !condition : `not (${condition})`;
}

/**
 * Works out how Knative's broker evaluates filter expressions, leaving out the ones it skips.
 *
 * @param filters - The expressions.
 * @returns How each expression that Knative keeps decides.
 */
function evaluateFilters(filters: TriggerFilter[]): FilterOutcome[] {
  return filters
    .map(evaluateFilter)
    .filter((outcome): outcome is FilterOutcome => outcome !== undefined);
}

/**
 * Works out how Knative's broker evaluates one filter expression. Like Knative, it reads only the
 * first dialect that is set. An `all` or `any` whose members are all skipped, and a `not` of a
 * skipped expression, decide nothing. Knative's `all` rejects when a member rejects and `any`
 * passes when a member passes; otherwise both return the result of their last member. Both move
 * the members that settle them to the front, so the last member of an `all` is one that never
 * rejects, if there is one, and the last member of an `any` is one that never passes. Only filters
 * with empty pieces have such members; for them Knative's result can also depend on the order its
 * members settle into from the events it sees, and this assumes the written order otherwise.
 *
 * @param filter - The expression.
 * @returns How the expression decides, or undefined when Knative skips it.
 */
function evaluateFilter(filter: TriggerFilter): FilterOutcome | undefined {
  const attributes = [
    { values: filter.exact, operator: '=' },
    { values: filter.prefix, operator: 'starts with' },
    { values: filter.suffix, operator: 'ends with' },
  ].find(({ values }) => Object.keys(values ?? {}).length > 0);
  if (attributes) {
    const parts = formatAttributes(attributes.values, attributes.operator);
    const condition = parts.join(' and ');
    return parts.length ? { passes: condition, delivers: condition } : undefined;
  }

  if (filter.all?.length) {
    const members = evaluateFilters(filter.all);
    if (members.length <= 1) {
      return members[0] ?? UNDECIDED;
    }
    const join = (parts: string[]) => `all of (${parts.join('; ')})`;
    const delivers = members.map(member => member.delivers);
    const last =
      members.filter(member => member.delivers === true).pop() ?? members[members.length - 1];
    return { passes: allHold([...delivers, last.passes], join), delivers: allHold(delivers, join) };
  }

  if (filter.any?.length) {
    const members = evaluateFilters(filter.any);
    if (members.length <= 1) {
      return members[0] ?? UNDECIDED;
    }
    const passes = members.map(member => member.passes);
    const last =
      members.filter(member => member.passes === false).pop() ?? members[members.length - 1];
    return { passes: anyHolds(passes), delivers: anyHolds([...passes, last.delivers]) };
  }

  if (filter.not) {
    const inner = evaluateFilter(filter.not);
    return inner ? { passes: negate(inner.delivers), delivers: negate(inner.passes) } : UNDECIDED;
  }

  if (filter.cesql) {
    const condition = `CESQL ${filter.cesql}`;
    return { passes: condition, delivers: condition };
  }
  return undefined;
}

/**
 * Formats which events a Trigger lets through, for display.
 *
 * @param spec - The Trigger's spec, if it has one.
 * @returns The conditions under which an event is delivered, joined with `and`, or `All events`
 * when nothing is filtered.
 */
export function formatTriggerFilter(spec?: KnativeTrigger['spec']): string {
  if (spec?.filters?.length) {
    const delivers = allHold(
      evaluateFilters(spec.filters).map(outcome => outcome.delivers),
      parts => parts.join(' and ')
    );
    return typeof delivers === 'string' ? delivers : 'All events';
  }

  const attributes = Object.entries(spec?.filter?.attributes ?? {}).map(([key, value]) =>
    value === '' ? `${key} is set` : `${key} = ${value}`
  );
  return attributes.length ? attributes.join(' and ') : 'All events';
}

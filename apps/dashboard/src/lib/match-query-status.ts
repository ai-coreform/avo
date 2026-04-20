import type { UseQueryResult } from "@tanstack/react-query";
import {
  type ComponentType,
  createElement,
  isValidElement,
  type JSX,
  type ReactElement,
} from "react";

type Renderable<P extends Record<string, unknown> = Record<string, never>> =
  | ReactElement
  | ComponentType<P>;

function renderState<P extends Record<string, unknown>>(
  state: Renderable<P>,
  props?: P
): JSX.Element {
  if (isValidElement(state)) {
    return state;
  }

  // After isValidElement narrows away ReactElement, state is ComponentType<P>.
  // createElement's generics don't propagate P, so a cast is needed here.
  return props === undefined
    ? createElement(state as ComponentType)
    : createElement(state as ComponentType<P>, props);
}

interface MatchOptionsWithEmpty<TData, TError> {
  Loading: Renderable;
  Errored: Renderable<{ error: TError }>;
  Empty: Renderable;
  Success: Renderable<{
    data: NonNullable<UseQueryResult<TData, TError>["data"]>;
  }>;
}

interface MatchOptionsWithoutEmpty<TData, TError> {
  Loading: Renderable;
  Errored: Renderable<{ error: TError }>;
  Empty?: undefined;
  Success: Renderable<{
    data: UseQueryResult<TData, TError>["data"];
  }>;
}

/**
 * Match the state of a query to a set of components.
 *
 * Useful for rendering different UI based on the state of a query.
 *
 * **Note:** if you don't provide an `Empty` component and the query is empty,
 * the data in the Success component will be also typed as undefined.
 * @example ```jsx
 * const query = useQuery({... });
 * return matchQueryStatus(query, {
 *   Loading,
 *   Errored,
 *   Success,
 *   //          ^ type of T | null
 * })
 * ```
 * If you provide an `Empty` component, the data will be typed as non-nullable.
 * @example ```jsx
 * const query = useQuery({... });
 *
 * return matchQueryStatus(query, {
 *    Loading,
 *    Errored,
 *    Empty,
 *    Success,
 *    //          ^ type of data is T
 * );
 * ```
 */
export function matchQueryStatus<TData, TError>(
  query: UseQueryResult<TData, TError>,
  options:
    | MatchOptionsWithEmpty<TData, TError>
    | MatchOptionsWithoutEmpty<TData, TError>
): JSX.Element {
  if (query.isLoading) {
    return renderState(options.Loading);
  }

  if (query.isError) {
    return renderState(options.Errored, {
      error: query.error,
    });
  }

  const isEmpty =
    query.data === undefined ||
    query.data === null ||
    (Array.isArray(query.data) && query.data.length === 0);

  if (isEmpty && options.Empty) {
    return renderState(options.Empty);
  }

  // The Success component expects data matching the option variant.
  // When Empty is provided, data is guaranteed non-nullable at this point.
  // When Empty is not provided, data may include undefined, matching the type.
  return renderState(
    options.Success as Renderable<{
      data: UseQueryResult<TData, TError>["data"];
    }>,
    { data: query.data }
  );
}

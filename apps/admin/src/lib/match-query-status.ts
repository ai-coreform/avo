import type { UseQueryResult } from "@tanstack/react-query";
import {
  type ComponentType,
  createElement,
  isValidElement,
  type JSX,
  type ReactElement,
} from "react";

type EmptyProps = Record<string, never>;
type Renderable<P = EmptyProps> = ReactElement | ComponentType<P>;

function renderState<P>(state: Renderable<P>, props?: P): JSX.Element {
  if (isValidElement(state)) {
    return state;
  }

  // biome-ignore lint/suspicious/noExplicitAny: React.createElement requires a concrete props type; generic P doesn't satisfy its `extends {}` constraint
  const Component = state as ComponentType<any>;
  return props === undefined
    ? createElement(Component)
    : createElement(Component, props);
}
export function matchQueryStatus<TData, TError>(
  query: UseQueryResult<TData, TError>,
  options:
    | {
        Loading: Renderable;
        Errored: Renderable<{ error: TError }>;
        Success: Renderable<{
          data: UseQueryResult<TData, TError>["data"];
        }>;
      }
    | {
        Loading: Renderable;
        Errored: Renderable<{ error: TError }>;
        Empty: Renderable;
        Success: Renderable<{
          data: NonNullable<UseQueryResult<TData, TError>["data"]>;
        }>;
      }
): JSX.Element;
export function matchQueryStatus<TData, TError>(
  query: UseQueryResult<TData, TError>,
  {
    Loading,
    Errored,
    Empty,
    Success,
  }: {
    Loading: Renderable;
    Errored: Renderable<{ error: TError }>;
    Empty?: Renderable;
    Success: Renderable<{
      data: UseQueryResult<TData, TError>["data"];
    }>;
  }
): JSX.Element {
  if (query.isLoading) {
    return renderState(Loading);
  }

  if (query.isError) {
    return renderState(Errored, {
      error: query.error,
    });
  }

  const isEmpty =
    query.data === undefined ||
    query.data === null ||
    (Array.isArray(query.data) && query.data.length === 0);

  if (isEmpty && Empty) {
    return renderState(Empty);
  }

  return renderState(Success, {
    data: query.data,
  });
}

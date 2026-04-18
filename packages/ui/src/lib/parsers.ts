import { dataTableConfig } from "@avo/ui/config/data-table";
import type {
  ExtendedColumnFilter,
  ExtendedColumnSort,
} from "@avo/ui/types/data-table";
import { createParser } from "nuqs/server";
import { z } from "zod";

const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

export const getSortingStateParser = <TData>(
  columnIds?: string[] | Set<string>
) => {
  let validKeys: Set<string> | null = null;
  if (columnIds) {
    validKeys = columnIds instanceof Set ? columnIds : new Set(columnIds);
  }

  return createParser<ExtendedColumnSort<TData>[]>({
    parse: (value: string) => {
      try {
        const parsed = JSON.parse(value);
        const result = z.array(sortingItemSchema).safeParse(parsed);

        if (!result.success) {
          return null;
        }

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null;
        }

        return result.data as ExtendedColumnSort<TData>[];
      } catch {
        return null;
      }
    },
    serialize: (value: ExtendedColumnSort<TData>[]) => JSON.stringify(value),
    eq: (a: ExtendedColumnSort<TData>[], b: ExtendedColumnSort<TData>[]) =>
      a.length === b.length &&
      a.every(
        (item: ExtendedColumnSort<TData>, index: number) =>
          item.id === b[index]?.id && item.desc === b[index]?.desc
      ),
  });
};

const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
});

export type FilterItemSchema = z.infer<typeof filterItemSchema>;

export const getFiltersStateParser = <TData>(
  columnIds?: string[] | Set<string>
) => {
  let validKeys: Set<string> | null = null;
  if (columnIds) {
    validKeys = columnIds instanceof Set ? columnIds : new Set(columnIds);
  }

  return createParser<ExtendedColumnFilter<TData>[]>({
    parse: (value: string) => {
      try {
        const parsed = JSON.parse(value);
        const result = z.array(filterItemSchema).safeParse(parsed);

        if (!result.success) {
          return null;
        }

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null;
        }

        return result.data as ExtendedColumnFilter<TData>[];
      } catch {
        return null;
      }
    },
    serialize: (value: ExtendedColumnFilter<TData>[]) => JSON.stringify(value),
    eq: (a: ExtendedColumnFilter<TData>[], b: ExtendedColumnFilter<TData>[]) =>
      a.length === b.length &&
      a.every(
        (filter: ExtendedColumnFilter<TData>, index: number) =>
          filter.id === b[index]?.id &&
          filter.value === b[index]?.value &&
          filter.variant === b[index]?.variant &&
          filter.operator === b[index]?.operator
      ),
  });
};

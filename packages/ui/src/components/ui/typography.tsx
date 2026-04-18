import { cn } from "@avo/ui/lib/utils";
import React from "react";

// Reusable helper to create components with consistent structure
const createComponent = <T extends HTMLElement>(
  tag: keyof React.JSX.IntrinsicElements,
  defaultClassName: string,
  displayName: string
) => {
  const Component = ({
    ref,
    ...props
  }: React.HTMLAttributes<T> & { ref?: React.RefObject<T | null> }) =>
    React.createElement(
      tag,
      { ...props, ref, className: cn(defaultClassName, props.className) },
      props.children
    );
  Component.displayName = displayName;
  return Component;
};

export const H1 = createComponent<HTMLHeadingElement>(
  "h1",
  "text-4xl font-extrabold",
  "H1"
);

export const H2 = createComponent<HTMLHeadingElement>(
  "h2",
  "text-3xl font-semibold",
  "H2"
);

export const H3 = createComponent<HTMLHeadingElement>(
  "h3",
  "text-2xl font-semibold",
  "H3"
);

export const H4 = createComponent<HTMLHeadingElement>(
  "h4",
  "text-xl font-semibold",
  "H4"
);

export const Lead = createComponent<HTMLParagraphElement>(
  "p",
  "text-xl text-muted-foreground",
  "Lead"
);

export const P = createComponent<HTMLParagraphElement>("p", "leading-7", "P");

export const Large = createComponent<HTMLDivElement>("div", "text-lg", "Large");

export const Base = createComponent<HTMLParagraphElement>(
  "p",
  "text-base",
  "Base"
);

export const Small = createComponent<HTMLParagraphElement>(
  "p",
  "text-sm font-regular",
  "Small"
);

export const ExtraSmall = createComponent<HTMLParagraphElement>(
  "p",
  "text-xs font-regular leading-3",
  "ExtraSmall"
);

export const Muted = createComponent<HTMLSpanElement>(
  "span",
  "text-sm text-muted-foreground",
  "Muted"
);

export const InlineCode = createComponent<HTMLSpanElement>(
  "code",
  "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
  "InlineCode"
);

export const MultilineCode = createComponent<HTMLPreElement>(
  "pre",
  "relative rounded bg-muted p-4 font-mono text-sm font-semibold overflow-x-auto",
  "MultilineCode"
);

export const List = createComponent<HTMLUListElement>(
  "ul",
  "my-6 ml-6 list-disc [&>li]:mt-2",
  "List"
);

export const Quote = createComponent<HTMLQuoteElement>(
  "blockquote",
  "mt-6 border-l-2 pl-6 italic text-muted-foreground",
  "Quote"
);

import { KBarResults, useMatches } from "kbar";
import { useRef } from "react";
import ResultItem from "./result-item";

export default function RenderResults() {
  const { results, rootActionId } = useMatches();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="px-4 py-2 text-black text-sm uppercase opacity-50">
            {item}
          </div>
        ) : (
          <ResultItem
            action={item}
            active={active}
            currentRootActionId={rootActionId ?? ""}
            ref={ref}
          />
        )
      }
    />
  );
}

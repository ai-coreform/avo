/**
 * Small pill shown on catalog items / menu resources that originate from a
 * partner integration (e.g. Connect). Owners see this as a cue that the
 * underlying data is synced from an external system and edits here will
 * propagate back.
 *
 * Use a sibling placement with any resource title:
 *
 *   <span className="inline-flex items-center gap-2">
 *     <span>{item.title}</span>
 *     <PartnerSourceBadge source={item.externalSource} />
 *   </span>
 */

const PARTNER_LABELS: Record<string, string> = {
  connect: "Connect",
};

export function PartnerSourceBadge({
  source,
  size = "sm",
}: {
  source: string | null | undefined;
  size?: "sm" | "xs";
}) {
  if (!source) {
    return null;
  }
  const label = PARTNER_LABELS[source] ?? source;
  const sizeClass =
    size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-500/10 font-medium text-blue-700 dark:text-blue-300 ${sizeClass}`}
      title={`Questo articolo è gestito da ${label}. Le modifiche si sincronizzano con l'integrazione.`}
    >
      <span className="size-1.5 rounded-full bg-blue-500" />
      {label}
    </span>
  );
}

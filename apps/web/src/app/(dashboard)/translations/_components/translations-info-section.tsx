import { RefreshCw } from "lucide-react";

export function TranslationsInfoSection() {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="space-y-2 font-sans text-[13px] text-muted-foreground leading-relaxed">
        <p>
          <strong className="font-semibold text-foreground">
            Traduzione automatica
          </strong>{" "}
          &mdash; Ogni volta che crei o modifichi un elemento, le traduzioni
          vengono generate automaticamente con AI.
        </p>
        <p>
          <strong className="font-semibold text-foreground">
            Traduzione intelligente
          </strong>{" "}
          &mdash; I nomi italiani universali (tiramis&ugrave;, Negroni) restano
          invariati. I nomi propri non vengono tradotti. I testi descrittivi
          vengono tradotti naturalmente.
        </p>
        <p>
          <strong className="font-semibold text-foreground">
            Aggiungi lingua
          </strong>{" "}
          &mdash; Puoi aggiungere qualsiasi lingua supportata dal modello AI. Le
          traduzioni verranno generate automaticamente.
        </p>
        <p>
          <strong className="font-semibold text-foreground">Ri-traduci</strong>{" "}
          &mdash; Usa il pulsante <RefreshCw className="inline size-3" /> su
          ogni lingua per rigenerare tutte le traduzioni, oppure scegli
          &ldquo;Traduci mancanti&rdquo; per tradurre solo gli elementi non
          ancora tradotti.
        </p>
      </div>
    </div>
  );
}

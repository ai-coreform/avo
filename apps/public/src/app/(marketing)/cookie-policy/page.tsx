import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Cookie policy di Avo — quali cookie utilizziamo e come gestirli.",
  robots: { index: false, follow: true },
};

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <Link
        className="text-ink/40 text-sm transition-colors hover:text-ink/70"
        href="/"
      >
        &larr; Torna al sito
      </Link>

      <h1 className="mt-6 mb-8 font-bold font-display text-3xl">
        Cookie Policy
      </h1>
      <p className="mb-10 text-ink/50 text-sm">
        Ultimo aggiornamento: 18 aprile 2026
      </p>

      <div className="prose-sm space-y-6 text-ink/70 leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:text-lg [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-display [&_h3]:font-semibold [&_h3]:text-ink">
        <h2>Cosa sono i cookie</h2>
        <p>
          I cookie sono piccoli file di testo che i siti web memorizzano sul tuo
          dispositivo per ricordare le preferenze e migliorare l&apos;esperienza
          di navigazione.
        </p>

        <h2>Cookie che utilizziamo</h2>

        <h3>Cookie tecnici (sempre attivi)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm [&_td]:border-ink/5 [&_td]:border-b [&_td]:py-2 [&_td]:pr-4 [&_th]:border-ink/10 [&_th]:border-b [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-medium [&_th]:text-ink">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Scopo</th>
                <th>Durata</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>avo-cookie-consent</td>
                <td>Memorizza la tua scelta sui cookie</td>
                <td>Persistente (localStorage)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Questi cookie sono necessari per il funzionamento del sito e non
          richiedono consenso.
        </p>

        <h3>Cookie di marketing e analisi (previo consenso)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm [&_td]:border-ink/5 [&_td]:border-b [&_td]:py-2 [&_td]:pr-4 [&_th]:border-ink/10 [&_th]:border-b [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-medium [&_th]:text-ink">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Fornitore</th>
                <th>Scopo</th>
                <th>Durata</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>_fbp</td>
                <td>Meta Platforms</td>
                <td>Identifica il browser per pubblicit&agrave; e analisi</td>
                <td>3 mesi</td>
              </tr>
              <tr>
                <td>_fbc</td>
                <td>Meta Platforms</td>
                <td>Traccia i click sugli annunci</td>
                <td>3 mesi</td>
              </tr>
              <tr>
                <td>fr</td>
                <td>Meta Platforms</td>
                <td>Pubblicit&agrave; mirata e misurazione</td>
                <td>3 mesi</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Questi cookie vengono attivati solo dopo aver cliccato
          &ldquo;Accetta&rdquo; nel banner cookie. Puoi revocare il consenso in
          qualsiasi momento cancellando i cookie del browser.
        </p>

        <h2>Come gestire i cookie</h2>
        <p>
          Puoi controllare e/o eliminare i cookie tramite le impostazioni del
          tuo browser. Puoi anche revocare il consenso cancellando i dati del
          sito nelle impostazioni del browser e ricaricando la pagina: il banner
          verr&agrave; mostrato nuovamente.
        </p>

        <h2>Maggiori informazioni</h2>
        <p>
          Per ulteriori dettagli su come trattiamo i tuoi dati personali,
          consulta la nostra <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          Per domande, scrivi a{" "}
          <a href="mailto:team@avomenu.com">team@avomenu.com</a>.
        </p>
      </div>
    </main>
  );
}

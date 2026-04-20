import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Informativa sulla privacy di Avo — come trattiamo i tuoi dati personali.",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <Link
        className="text-ink/40 text-sm transition-colors hover:text-ink/70"
        href="/"
      >
        &larr; Torna al sito
      </Link>

      <h1 className="mt-6 mb-8 font-bold font-display text-3xl">
        Privacy Policy
      </h1>
      <p className="mb-10 text-ink/50 text-sm">
        Ultimo aggiornamento: 18 aprile 2026
      </p>

      <div className="prose-sm space-y-6 text-ink/70 leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:text-lg [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-display [&_h3]:font-semibold [&_h3]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <h2>1. Titolare del trattamento</h2>
        <p>
          Coreform Limited
          <br />
          Company number: 16633802
          <br />
          14 Peridot House 4 Woodlands Avenue, London, W3 9DY, United Kingdom
          <br />
          Email: <a href="mailto:team@avomenu.com">team@avomenu.com</a>
        </p>

        <h2>2. Dati raccolti</h2>
        <h3>Dati forniti volontariamente</h3>
        <p>Quando compili il modulo di prova gratuita, raccogliamo:</p>
        <ul>
          <li>Nome e cognome</li>
          <li>Nome dell&apos;attivit&agrave;</li>
          <li>Numero di telefono</li>
          <li>Provincia</li>
          <li>Come hai scoperto Avo (facoltativo)</li>
        </ul>

        <h3>Dati raccolti automaticamente</h3>
        <p>
          Se accetti i cookie analitici, il Meta Pixel raccoglie dati anonimi di
          navigazione (pagine visitate, interazioni) per finalit&agrave; di
          marketing e analisi del traffico. Nessun cookie di profilazione viene
          attivato senza il tuo consenso.
        </p>

        <h2>3. Finalit&agrave; e base giuridica</h2>
        <ul>
          <li>
            <strong>Gestione richieste di prova gratuita</strong> &mdash; base
            giuridica: esecuzione di misure precontrattuali (Art. 6(1)(b) UK
            GDPR).
          </li>
          <li>
            <strong>Notifiche interne</strong> &mdash; i dati del modulo vengono
            inviati al nostro team tramite Slack per consentire un follow-up
            rapido. Base giuridica: legittimo interesse (Art. 6(1)(f) UK GDPR).
          </li>
          <li>
            <strong>Analisi del traffico e marketing</strong> &mdash; tramite
            Meta Pixel, solo previo consenso. Base giuridica: consenso (Art.
            6(1)(a) UK GDPR).
          </li>
        </ul>

        <h2>4. Destinatari dei dati</h2>
        <p>I tuoi dati possono essere condivisi con:</p>
        <ul>
          <li>
            <strong>Notion</strong> (Notion Labs, Inc., USA) &mdash; CRM per la
            gestione dei contatti.
          </li>
          <li>
            <strong>Slack</strong> (Salesforce, Inc., USA) &mdash; notifiche
            interne al team.
          </li>
          <li>
            <strong>Meta Platforms</strong> (Meta Platforms, Inc., USA) &mdash;
            analisi e pubblicit&agrave;, solo previo consenso.
          </li>
          <li>
            <strong>Vercel</strong> (Vercel, Inc., USA) &mdash; hosting del
            sito.
          </li>
        </ul>
        <p>
          Per i trasferimenti verso gli USA, ci affidiamo alle clausole
          contrattuali standard (SCC) della Commissione Europea e/o
          all&apos;adesione dei fornitori al UK Extension to the EU-US Data
          Privacy Framework.
        </p>

        <h2>5. Conservazione dei dati</h2>
        <p>
          I dati del modulo di contatto vengono conservati per un massimo di 24
          mesi dall&apos;ultima interazione. I dati di navigazione raccolti
          tramite cookie vengono conservati secondo le policy di Meta
          (tipicamente 180 giorni).
        </p>

        <h2>6. I tuoi diritti</h2>
        <p>Hai il diritto di:</p>
        <ul>
          <li>Accedere ai tuoi dati personali</li>
          <li>Rettificare dati inesatti</li>
          <li>Richiedere la cancellazione dei dati</li>
          <li>Limitare od opporti al trattamento</li>
          <li>Richiedere la portabilit&agrave; dei dati</li>
          <li>Revocare il consenso in qualsiasi momento</li>
        </ul>
        <p>
          Per esercitare i tuoi diritti, scrivi a{" "}
          <a href="mailto:team@avomenu.com">team@avomenu.com</a>.
        </p>
        <p>
          Hai inoltre il diritto di presentare un reclamo presso
          l&apos;Information Commissioner&apos;s Office (ICO) del Regno Unito (
          <a
            href="https://ico.org.uk"
            rel="noopener noreferrer"
            target="_blank"
          >
            ico.org.uk
          </a>
          ) o presso il Garante per la protezione dei dati personali italiano (
          <a
            href="https://www.garanteprivacy.it"
            rel="noopener noreferrer"
            target="_blank"
          >
            garanteprivacy.it
          </a>
          ).
        </p>

        <h2>7. Cookie</h2>
        <p>
          Per informazioni dettagliate sui cookie utilizzati, consulta la nostra{" "}
          <Link href="/cookie-policy">Cookie Policy</Link>.
        </p>

        <h2>8. Modifiche</h2>
        <p>
          Ci riserviamo di aggiornare questa informativa. Eventuali modifiche
          saranno pubblicate su questa pagina con la data di ultimo
          aggiornamento.
        </p>
      </div>
    </main>
  );
}

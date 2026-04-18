import Link from "next/link";

const MESSAGES: Record<string, { title: string; body: string }> = {
  claim_not_found: {
    title: "Link non valido",
    body: "Il link di attivazione non è stato riconosciuto. Verifica di aver copiato l'URL per intero o chiedi al tuo gestionale un nuovo invito.",
  },
  claim_expired: {
    title: "Link scaduto",
    body: "Questo link di attivazione è scaduto. Chiedi al tuo gestionale di generarne uno nuovo.",
  },
  claim_already_used: {
    title: "Account già attivato",
    body: "Questo account è già stato attivato. Accedi dalla pagina di login.",
  },
};

const DEFAULT_MESSAGE = {
  title: "Attivazione non riuscita",
  body: "Qualcosa è andato storto durante l'attivazione. Riprova più tardi o contatta il supporto.",
};

export default async function ClaimErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason ?? "";
  const { title, body } = MESSAGES[reason] ?? DEFAULT_MESSAGE;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <h1 className="font-semibold text-2xl">{title}</h1>
      <p className="text-base text-muted-foreground">{body}</p>
      <Link
        className="rounded-md border border-border px-4 py-2 font-medium text-sm hover:bg-accent"
        href="/login"
      >
        Vai al login
      </Link>
    </main>
  );
}

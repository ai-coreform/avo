interface PublicMenuErroredProps {
  error: Error;
}

export function PublicMenuErrored({ error }: PublicMenuErroredProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="max-w-sm space-y-3 px-6 text-center">
        <h1 className="font-bold text-2xl text-zinc-900">
          Menu non disponibile
        </h1>
        <p className="text-sm text-zinc-500">
          {error.message.includes("404")
            ? "Il menu richiesto non è stato trovato. Verifica l'indirizzo e riprova."
            : "Si è verificato un errore durante il caricamento del menu. Riprova più tardi."}
        </p>
        <button
          className="mt-4 rounded-lg bg-zinc-900 px-6 py-2 font-sans text-sm text-white transition-colors hover:bg-zinc-800"
          onClick={() => window.location.reload()}
          type="button"
        >
          Riprova
        </button>
      </div>
    </div>
  );
}

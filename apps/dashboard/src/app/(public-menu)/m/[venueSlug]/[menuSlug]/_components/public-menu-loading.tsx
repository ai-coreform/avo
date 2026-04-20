export function PublicMenuLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="space-y-4 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
        <p className="font-sans text-sm text-zinc-400">Caricamento menu...</p>
      </div>
    </div>
  );
}

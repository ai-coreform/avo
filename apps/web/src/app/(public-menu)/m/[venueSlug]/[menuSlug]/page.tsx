import { PublicMenuView } from "./_components/public-menu-view";

interface PublicMenuPageProps {
  params:
    | Promise<{ venueSlug: string; menuSlug: string }>
    | { venueSlug: string; menuSlug: string };
}

export default async function PublicMenuPage({ params }: PublicMenuPageProps) {
  const resolvedParams = await params;

  return (
    <PublicMenuView
      menuSlug={resolvedParams.menuSlug}
      venueSlug={resolvedParams.venueSlug}
    />
  );
}

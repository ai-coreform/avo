import { MenuDetailPageView } from "./_components/menu-detail-page-view";

interface MenuDetailPageProps {
  params:
    | Promise<{
        menuSlug: string;
      }>
    | {
        menuSlug: string;
      };
}

export default async function MenuDetailPage({ params }: MenuDetailPageProps) {
  const resolvedParams = await params;

  return <MenuDetailPageView menuSlug={resolvedParams.menuSlug} />;
}

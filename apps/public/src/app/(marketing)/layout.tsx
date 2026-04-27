import { CookieBanner } from "@/components/cookie-banner";
import { MetaPixel } from "@/components/meta-pixel";

/**
 * Marketing-only layout. Adds tracking + cookie compliance UI on top of the
 * root layout (which provides fonts + providers). The menu surface at /m/...
 * intentionally lives OUTSIDE this group: customers reading a menu shouldn't
 * be tracked by marketing pixels they never opted into.
 */
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <MetaPixel />
      <CookieBanner />
    </>
  );
}

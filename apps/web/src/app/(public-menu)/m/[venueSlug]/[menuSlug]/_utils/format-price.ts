export function formatPrice(value: number | null | undefined): string {
  if (value == null) {
    return "";
  }
  const euros = value / 100;
  return `€${euros.toFixed(2).replace(".", ",")}`;
}

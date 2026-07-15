export function dynamicFontSize(text: string): string {
  const len = text.replace(/-/g, "").length;
  if (len <= 7) return "text-6xl";
  if (len <= 11) return "text-5xl";
  if (len <= 14) return "text-4xl";
  return "text-3xl";
}
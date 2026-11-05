export function formatDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", { timeZone: "Europe/Sofia", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

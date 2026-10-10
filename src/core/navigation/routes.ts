export function normalizeRoute(path: string): string {
  if (!path) {
    return "/";
  }

  const normalized = path.replace(/\/\([^)]+\)/g, "").replace(/\/{2,}/g, "/");

  if (normalized.length > 1 && normalized.endsWith("/")) {
    return normalized.slice(0, -1);
  }

  return normalized || "/";
}

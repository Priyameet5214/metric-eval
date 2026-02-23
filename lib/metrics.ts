/**
 * Fetches all current metric names for the authenticated user.
 * Optionally filters by search string (case-insensitive substring match).
 */
export async function getMetricNames(search?: string): Promise<string[]> {
  const params = new URLSearchParams();
  if (search != null && search.trim() !== "") {
    params.set("q", search.trim());
  }
  const url = `/api/metric-names${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to fetch metric names");
  }
  const data = (await res.json()) as { names: string[] };
  return data.names ?? [];
}

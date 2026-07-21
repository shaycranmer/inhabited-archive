export type ArchiveD1Result<T> = {
  results: T[];
};

export type ArchiveD1Statement = {
  bind(...values: unknown[]): ArchiveD1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<ArchiveD1Result<T>>;
};

export type ArchiveD1Database = {
  prepare(query: string): ArchiveD1Statement;
};

export async function getArchiveDb(): Promise<ArchiveD1Database> {
  const { env } = await import("cloudflare:workers");
  const binding = (env as unknown as { DB?: ArchiveD1Database }).DB;
  if (!binding) {
    throw new Error(
      "The installed shelf is not attached to this copy of the archive yet.",
    );
  }
  return binding;
}

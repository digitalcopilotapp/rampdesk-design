/**
 * RampDesk integration: when a project is created, attempt to seed it with
 * design tokens from `~/.hermes/design/<slug>/tokens.json` on the host.
 *
 * The host directory is mounted at /hermes-design inside the container (see
 * deploy/docker-compose.yml volumes). Returns null if no tokens found OR the
 * tokens are still in the AWAITING-MOODBOARD placeholder state, so generation
 * falls back to the open-systems registry default (Vercel Geist).
 */
import fs from "node:fs/promises";
import path from "node:path";

const TOKENS_ROOT = process.env.HERMES_DESIGN_ROOT ?? "/hermes-design";

export async function loadHermesDesignTokens(projectSlug: string): Promise<Record<string, unknown> | null> {
  if (!projectSlug || projectSlug === "default") return null;
  const tokensPath = path.join(TOKENS_ROOT, projectSlug, "tokens.json");
  try {
    const raw = await fs.readFile(tokensPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: string; approvedBy?: string };
    // Reject AWAITING placeholder states — generation should use fallback open-system.
    if (parsed.version?.startsWith("0.0.0-AWAITING") || parsed.approvedBy?.includes("PENDING")) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

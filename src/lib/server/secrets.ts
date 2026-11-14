import { readFileSync } from "node:fs";

/** Read runtime secrets from the environment or a Docker/Kubernetes secret file. */
export function readServerSecret(name: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;

  const filePath = process.env[`${name}_FILE`]?.trim();
  if (!filePath) return "";
  try {
    return readFileSync(filePath, "utf8").trim();
  } catch {
    return "";
  }
}

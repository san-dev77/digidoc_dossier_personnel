import fs from "fs";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "logs");

export type LogLevel = "info" | "success" | "warning" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
}

interface LogOptions {
  context?: string;
  meta?: Record<string, unknown>;
}

function todayFileName(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}.log`;
}

function writeToConsole(entry: LogEntry) {
  const prefix = `[${entry.level.toUpperCase()}]${
    entry.context ? ` [${entry.context}]` : ""
  }`;
  const consoleMethod =
    entry.level === "error"
      ? console.error
      : entry.level === "warning"
      ? console.warn
      : console.log;
  consoleMethod(prefix, entry.message, entry.meta ?? "");
}

// Écrit sur disque uniquement quand fs est disponible (runtime Node.js).
// En Edge Runtime, l'écriture échoue silencieusement et le log reste
// visible dans la console.
function writeToFile(entry: LogEntry) {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    const filePath = path.join(LOGS_DIR, todayFileName());
    fs.appendFileSync(filePath, JSON.stringify(entry) + "\n", "utf-8");
  } catch {
    // Edge Runtime ou disque en lecture seule : on garde le log en console.
  }
}

function log(level: LogLevel, message: string, options?: LogOptions) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: options?.context,
    meta: options?.meta,
  };
  writeToFile(entry);
  writeToConsole(entry);
}

export const logger = {
  info: (message: string, options?: LogOptions) => log("info", message, options),
  success: (message: string, options?: LogOptions) =>
    log("success", message, options),
  warning: (message: string, options?: LogOptions) =>
    log("warning", message, options),
  error: (message: string, options?: LogOptions) =>
    log("error", message, options),
};

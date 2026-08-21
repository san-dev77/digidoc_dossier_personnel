"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollText,
  Lock,
  LogOut,
  Loader2,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

type LogLevel = "info" | "success" | "warning" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
}

interface LogFile {
  name: string;
  sizeBytes: number;
  modifiedAt: string;
}

const PAGE_SIZE = 25;

const LEVEL_STYLES: Record<
  LogLevel,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  info: {
    label: "Info",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Info className="w-3.5 h-3.5" />,
  },
  success: {
    label: "Succès",
    badge: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  warning: {
    label: "Avertissement",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  error: {
    label: "Erreur",
    badge: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function fileLabel(name: string): string {
  const dateStr = name.replace(".log", "");
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return name;
  const label = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function LogsViewerPage() {
  const [authState, setAuthState] = useState<"checking" | "locked" | "unlocked">(
    "checking"
  );
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [files, setFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadFiles = useCallback(async () => {
    const res = await fetch("/api/logs");
    if (res.status === 401) {
      setAuthState("locked");
      return;
    }
    if (!res.ok) return;
    const data = await res.json();
    setFiles(data.files || []);
    setAuthState("unlocked");
    if (data.files?.length > 0) {
      setSelectedFile((prev) => prev ?? data.files[0].name);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const loadEntries = useCallback(async (file: string) => {
    setEntriesLoading(true);
    try {
      const res = await fetch(`/api/logs/${file}`);
      if (res.status === 401) {
        setAuthState("locked");
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFile) {
      setPage(1);
      loadEntries(selectedFile);
    }
  }, [selectedFile, loadEntries]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/logs-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.message || "Mot de passe incorrect");
        return;
      }
      setPassword("");
      await loadFiles();
    } catch {
      setAuthError("Erreur réseau");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logs-auth", { method: "DELETE" });
    setAuthState("locked");
    setFiles([]);
    setEntries([]);
    setSelectedFile(null);
  };

  const counts = useMemo(() => {
    const c: Record<LogLevel, number> = { info: 0, success: 0, warning: 0, error: 0 };
    entries.forEach((e) => {
      if (c[e.level] !== undefined) c[e.level]++;
    });
    return c;
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (levelFilter !== "all" && e.level !== levelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${e.message} ${e.context || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [entries, levelFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (authState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (authState === "locked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <form
          onSubmit={handleUnlock}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-sm"
        >
          <div className="w-12 h-12 bg-primary-700 rounded-xl flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Journal de l&apos;application</h1>
          <p className="text-sm text-gray-500 mb-6">
            Accès distinct de l&apos;application — mot de passe dédié requis.
          </p>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full px-3 text-black py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-3"
          />
          {authError && (
            <p className="text-xs text-red-600 font-semibold mb-3">{authError}</p>
          )}
          <button
            type="submit"
            disabled={authLoading || !password}
            className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {authLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Déverrouiller
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-700 px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <ScrollText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Journal de l&apos;application</h1>
            <p className="text-xs text-primary-200">
              {files.length} jour{files.length > 1 ? "s" : ""} de logs disponibles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedFile && loadEntries(selectedFile)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${entriesLoading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Verrouiller
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {files.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <ScrollText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold text-sm">
              Aucun log enregistré pour l&apos;instant
            </p>
          </div>
        ) : (
          <>
            {/* Sélecteur de jour */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {files.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFile(f.name)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    selectedFile === f.name
                      ? "bg-primary-700 text-white border-primary-700"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                  title={formatBytes(f.sizeBytes)}
                >
                  {fileLabel(f.name)}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Filtres */}
              <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setLevelFilter("all");
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      levelFilter === "all"
                        ? "bg-primary-100 text-primary-700 border-primary-300"
                        : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    Tout ({entries.length})
                  </button>
                  {(Object.keys(LEVEL_STYLES) as LogLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setLevelFilter(lvl);
                        setPage(1);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        levelFilter === lvl
                          ? LEVEL_STYLES[lvl].badge
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {LEVEL_STYLES[lvl].icon}
                      {LEVEL_STYLES[lvl].label} ({counts[lvl]})
                    </button>
                  ))}
                </div>
                <div className="relative ml-auto min-w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Rechercher un message…"
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Liste des entrées */}
              {entriesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
                </div>
              ) : paged.length === 0 ? (
                <div className="text-center py-16 text-sm text-gray-500 font-semibold">
                  Aucune entrée pour ces filtres
                </div>
              ) : (
                <div>
                  {paged.map((entry, i) => {
                    const id = (currentPage - 1) * PAGE_SIZE + i;
                    const isOpen = expandedId === id;
                    const style = LEVEL_STYLES[entry.level] || LEVEL_STYLES.info;
                    const hasMeta = entry.meta && Object.keys(entry.meta).length > 0;

                    return (
                      <div key={id} className="border-b border-gray-100 last:border-b-0">
                        <button
                          onClick={() => hasMeta && setExpandedId(isOpen ? null : id)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                            hasMeta ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border flex-shrink-0 ${style.badge}`}
                          >
                            {style.icon}
                            {style.label}
                          </span>
                          <span className="text-xs text-gray-400 font-mono flex-shrink-0 pt-1 w-20">
                            {new Date(entry.timestamp).toLocaleTimeString("fr-FR")}
                          </span>
                          {entry.context && (
                            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                              {entry.context}
                            </span>
                          )}
                          <span className="text-sm text-gray-800 flex-1 min-w-0 break-words">
                            {entry.message}
                          </span>
                          {hasMeta && (
                            <ChevronDown
                              className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform mt-0.5 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </button>
                        {isOpen && hasMeta && (
                          <pre className="mx-4 mb-3 p-3 bg-gray-900 text-gray-100 text-[11px] rounded-lg overflow-x-auto">
                            {JSON.stringify(entry.meta, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">
                    {(currentPage - 1) * PAGE_SIZE + 1}
                    {"–"}
                    {Math.min(currentPage * PAGE_SIZE, filtered.length)} sur{" "}
                    {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-gray-700 px-1">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { HardDrive, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

interface FileEntry {
  name: string;
  fullPath: string;
  agentName: string | null;
  sizeBytes: number;
}

interface StockageData {
  totalSizeBytes: number;
  fileCount: number;
  averageSizeBytes: number;
  biggestFile: FileEntry | null;
  topContributor: { agentName: string; sizeBytes: number } | null;
  topAgents: { agentName: string; sizeBytes: number }[];
  files: FileEntry[];
  orphanCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function StorageUsage() {
  const [data, setData] = useState<StockageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil((data?.files.length || 0) / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const pagedFiles = useMemo(
    () =>
      (data?.files || []).slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [data, currentPage]
  );

  useEffect(() => {
    (async () => {
      try {
        const token = sessionStorage.getItem("auth-token");
        const res = await fetch("/api/audit/stockage", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erreur");
        setData(await res.json());
      } catch (err) {
        console.error("Erreur chargement stockage:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center gap-3">
        <HardDrive className="h-6 w-6 text-primary-700" />
        <div>
          <h3 className="text-xl font-black text-gray-900">
            Utilisation du stockage
          </h3>
          <p className="text-gray-600 font-semibold text-sm mt-0.5">
            Espace réellement consommé par les fichiers uploadés
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      ) : error || !data ? (
        <div className="text-center py-12 text-sm text-gray-500 font-semibold">
          Impossible de calculer l&apos;utilisation du stockage
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                Espace total
              </p>
              <p className="text-xl font-black text-gray-900">
                {formatBytes(data.totalSizeBytes)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.fileCount} fichier{data.fileCount > 1 ? "s" : ""}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                Plus gros fichier
              </p>
              <p className="text-xl font-black text-gray-900">
                {data.biggestFile ? formatBytes(data.biggestFile.sizeBytes) : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {data.biggestFile?.name || "Aucun fichier"}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                Moyenne / fichier
              </p>
              <p className="text-xl font-black text-gray-900">
                {formatBytes(data.averageSizeBytes)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Tous types confondus</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                + gros contributeur
              </p>
              <p className="text-xl font-black text-gray-900 truncate">
                {data.topContributor?.agentName || "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.topContributor
                  ? `${formatBytes(data.topContributor.sizeBytes)} au total`
                  : ""}
              </p>
            </div>
          </div>

          {data.topAgents.length > 0 && (
            <div className="px-6 pb-6">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3">
                Répartition par agent
              </p>
              <div className="flex flex-col gap-3">
                {data.topAgents.map((agent) => {
                  const max = data.topAgents[0].sizeBytes || 1;
                  const width = Math.max(4, (agent.sizeBytes / max) * 100);
                  return (
                    <div key={agent.agentName} className="flex items-center gap-3">
                      <span className="w-32 text-xs font-semibold text-gray-700 truncate flex-shrink-0">
                        {agent.agentName}
                      </span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full transition-all duration-700"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="w-20 text-xs font-bold text-gray-600 text-right flex-shrink-0">
                        {formatBytes(agent.sizeBytes)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-y-2 border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Fichier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Appartient à
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                    Taille
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedFiles.map((file, index) => (
                  <tr key={index} className="hover:bg-primary-50/40 transition-colors">
                    <td className="px-6 py-3 max-w-md">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {file.name}
                      </p>
                      <p
                        className="text-xs text-gray-500 font-mono truncate"
                        title={file.fullPath}
                      >
                        {file.fullPath}
                      </p>
                    </td>
                    <td className="px-6 py-3">
                      {file.agentName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {initials(file.agentName)}
                          </div>
                          <span className="text-sm text-gray-700">
                            {file.agentName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          Sans agent lié
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700 text-right font-semibold">
                      {formatBytes(file.sizeBytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data.files.length === 0 && (
              <div className="text-center py-10 text-sm text-gray-500 font-semibold">
                Aucun fichier trouvé
              </div>
            )}

            {data.files.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t-2 border-gray-100">
                <p className="text-xs font-semibold text-gray-500">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                  {"–"}
                  {Math.min(currentPage * PAGE_SIZE, data.files.length)} sur{" "}
                  {data.files.length} fichiers
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Page précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-gray-700 px-2">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Page suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {data.orphanCount > 0 && (
            <div className="mx-6 mb-6 mt-2 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
              <span>
                <b>{data.orphanCount}</b> fichier{data.orphanCount > 1 ? "s" : ""}{" "}
                référencé{data.orphanCount > 1 ? "s" : ""} en base{" "}
                {data.orphanCount > 1 ? "sont introuvables" : "est introuvable"} sur
                le disque — exclu{data.orphanCount > 1 ? "s" : ""} du calcul
                ci-dessus. Voir l&apos;agent de diagnostic pour le détail.
              </span>
            </div>
          )}

          <div className="mx-6 mb-6 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-800">
            <span>
              La colonne « Appartient à » indique l&apos;<b>agent</b> (le dossier
              personnel) auquel le fichier est rattaché — pas l&apos;utilisateur
              qui a effectué l&apos;envoi, cette information n&apos;étant pas
              enregistrée aujourd&apos;hui.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

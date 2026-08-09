"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

export interface ConnectionLogEntry {
  id: number;
  connected_at: string;
  utilisateur: { id: number; nom_complet: string; username: string };
}

interface ConnectionsByMonthProps {
  logs: ConnectionLogEntry[];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  const label = date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function ConnectionsByMonth({ logs }: ConnectionsByMonthProps) {
  const months = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; entries: ConnectionLogEntry[] }
    >();

    for (const log of logs) {
      const date = new Date(log.connected_at);
      const key = monthKey(date);
      if (!groups.has(key)) {
        groups.set(key, { label: monthLabel(date), entries: [] });
      }
      groups.get(key)!.entries.push(log);
    }

    return Array.from(groups.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, value]) => ({ key, ...value }));
  }, [logs]);

  const [openMonth, setOpenMonth] = useState<string | null>(
    months[0]?.key ?? null
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary-700" />
        <div>
          <h3 className="text-xl font-black text-gray-900">
            Connexions par mois
          </h3>
          <p className="text-gray-600 font-semibold text-sm mt-0.5">
            Regroupées par mois, dépliez pour voir le détail
          </p>
        </div>
      </div>

      {months.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-semibold text-sm">
            Aucune connexion enregistrée pour l&apos;instant
          </p>
        </div>
      ) : (
        <div>
          {months.map((month) => {
            const isOpen = openMonth === month.key;
            return (
              <div key={month.key} className="border-t border-gray-100 first:border-t-0">
                <button
                  onClick={() => setOpenMonth(isOpen ? null : month.key)}
                  className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="font-bold text-gray-900 text-sm">
                    {month.label}
                  </span>
                  <span className="ml-auto text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                    {month.entries.length} connexion
                    {month.entries.length > 1 ? "s" : ""}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-4 bg-gray-50">
                    {month.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {initials(entry.utilisateur.nom_complet)}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {entry.utilisateur.nom_complet}
                        </span>
                        <span className="ml-auto text-xs text-gray-500">
                          {new Date(entry.connected_at).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

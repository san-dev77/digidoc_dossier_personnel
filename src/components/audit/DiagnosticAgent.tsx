"use client";

import { useEffect, useState } from "react";
import { Bot, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface CheckResult {
  id: string;
  label: string;
  detail: string;
  status: "ok" | "warning" | "error";
}

interface DiagnosticResponse {
  ranAt: string;
  checks: CheckResult[];
}

const statusIcon = {
  ok: <CheckCircle2 className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />,
  error: <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />,
};

function scoreFromChecks(checks: CheckResult[]): number {
  if (checks.length === 0) return 100;
  const weight = { ok: 1, warning: 0.5, error: 0 } as const;
  const sum = checks.reduce((acc, c) => acc + weight[c.status], 0);
  return Math.round((sum / checks.length) * 100);
}

function scoreColor(percent: number): { ring: string; text: string } {
  if (percent >= 90) return { ring: "#16a34a", text: "text-accent-green" };
  if (percent >= 70) return { ring: "#d97706", text: "text-warning-600" };
  return { ring: "#dc2626", text: "text-red-600" };
}

/** Anneau circulaire : tourne indéfiniment quand `spinning`, sinon se remplit jusqu'à `percent`. */
function HealthRing({
  percent,
  spinning,
}: {
  percent: number;
  spinning: boolean;
}) {
  const size = 128;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    if (spinning) return;
    const t = setTimeout(() => setAnimated(percent), 60);
    return () => clearTimeout(t);
  }, [percent, spinning]);

  const colors = scoreColor(percent);
  const offset = circumference - (animated / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className={spinning ? "animate-spin" : ""}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={spinning ? "#94a3b8" : colors.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={spinning ? circumference * 0.75 : offset}
          style={{ transition: spinning ? "none" : "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      {!spinning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-black ${colors.text}`}>{percent}%</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            Fonctionnel
          </span>
        </div>
      )}
    </div>
  );
}

export default function DiagnosticAgent() {
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [result, setResult] = useState<DiagnosticResponse | null>(null);
  const [error, setError] = useState(false);

  async function runAudit() {
    setState("running");
    setError(false);
    try {
      const token = sessionStorage.getItem("auth-token");
      const res = await fetch("/api/audit/diagnostic", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur");
      setResult(await res.json());
      setState("done");
    } catch (err) {
      console.error("Erreur lors de l'audit système:", err);
      setError(true);
      setState("idle");
    }
  }

  const checks = result?.checks || [];
  const percent = scoreFromChecks(checks);
  const counts = {
    ok: checks.filter((c) => c.status === "ok").length,
    warning: checks.filter((c) => c.status === "warning").length,
    error: checks.filter((c) => c.status === "error").length,
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center flex-shrink-0">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900">
            Agent de diagnostic
          </h3>
          <p className="text-gray-600 font-semibold text-sm mt-0.5">
            Lance une vérification complète à la demande
          </p>
        </div>
      </div>

      {state === "idle" && (
        <div className="py-10 text-center px-6">
          <button
            onClick={runAudit}
            className="button-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-bold"
          >
            <Bot className="w-4 h-4" />
            Lancer l&apos;audit du système
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Vérifie la base, le stockage et les incohérences de données
          </p>
          {error && (
            <p className="text-xs text-red-600 font-semibold mt-2">
              L&apos;audit a échoué, réessayez.
            </p>
          )}
        </div>
      )}

      {state === "running" && (
        <div className="py-12 text-center">
          <div className="flex justify-center mb-3">
            <HealthRing percent={0} spinning />
          </div>
          <p className="text-sm font-bold text-gray-700">Analyse en cours…</p>
        </div>
      )}

      {state === "done" && result && (
        <div>
          <div className="flex flex-col items-center gap-3 px-6 py-8 border-b border-gray-100">
            <HealthRing percent={percent} spinning={false} />
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-accent-green">
                <span className="w-2 h-2 rounded-full bg-accent-green" />
                {counts.ok} OK
              </span>
              <span className="flex items-center gap-1.5 text-warning-600">
                <span className="w-2 h-2 rounded-full bg-warning-500" />
                {counts.warning} à surveiller
              </span>
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                {counts.error} en erreur
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500">
              Dernière analyse :{" "}
              {new Date(result.ranAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button
              onClick={runAudit}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Relancer
            </button>
          </div>
          <div className="px-6 py-2">
            {result.checks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0"
              >
                {statusIcon[check.status]}
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {check.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {check.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

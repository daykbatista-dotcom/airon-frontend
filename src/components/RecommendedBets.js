import React from "react";

// ─── CONFIDENCE RING ──────────────────────────────────────────────────────────
function ConfidenceRing({ value }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#34d399" : value >= 65 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(51,65,85,0.4)"
          strokeWidth="5"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="number-display text-sm font-bold"
          style={{ color, lineHeight: 1 }}
        >
          {value}%
        </span>
        <span className="text-slate-500 text-xs" style={{ fontSize: 9 }}>
          CONF.
        </span>
      </div>
    </div>
  );
}

// ─── OUTCOME BADGE ────────────────────────────────────────────────────────────
function OutcomeBadge({ outcome, prob }) {
  const labels = { "1": "LOCAL", X: "EMPATE", "2": "VISITANTE" };
  const colors = {
    "1": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    X: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "2": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${colors[outcome] || colors["1"]}`}
    >
      <span className="number-display">{prob}%</span>
      <span>{labels[outcome] || outcome}</span>
    </span>
  );
}

// ─── VALUE BET CARD ───────────────────────────────────────────────────────────
function ValueBetCard({ match, rank, onAnalyze }) {
  const mc = match.monteCarlo;
  const isTopPick = rank === 1;

  return (
    <div
      className={`value-bet-card rounded-xl p-5 cursor-pointer transition-all duration-200 animate-slide-up ${
        isTopPick ? "ring-1 ring-emerald-500/40" : ""
      }`}
      onClick={() => onAnalyze(match)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold display-font ${
              isTopPick
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            #{rank}
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {match.competition}
            </div>
            {match.isValueBet && (
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold">VALUE BET</span>
              </div>
            )}
          </div>
        </div>
        <ConfidenceRing value={mc?.confidenceIndex || 0} />
      </div>

      {/* Match */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <span className="display-font text-lg text-white leading-tight text-right flex-1">
            {match.homeTeam}
          </span>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <span className="text-slate-600 text-xs">VS</span>
            <span className="text-emerald-400 number-display text-sm font-bold">
              {match.mostLikelyScore}
            </span>
          </div>
          <span className="display-font text-lg text-white leading-tight flex-1">
            {match.awayTeam}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <OutcomeBadge outcome={mc?.primaryOutcome} prob={mc?.primaryProbability} />
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>
            BTTS{" "}
            <span className="text-slate-300 number-display">{mc?.bttsYes}%</span>
          </span>
          <span>
            +2.5{" "}
            <span className="text-slate-300 number-display">{mc?.over25}%</span>
          </span>
        </div>
      </div>

      {/* Data quality warning */}
      {match.dataQuality === "estimated" && (
        <div className="mt-3 flex items-center gap-1.5 text-amber-500/80 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Métricas estimadas (datos históricos limitados)</span>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function RecommendedBets({ valueBets, onAnalyze, loading }) {
  if (loading) {
    return (
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-5 w-5 rounded shimmer-bg" />
          <div className="h-5 w-48 rounded shimmer-bg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-5 h-52 shimmer-bg" />
          ))}
        </div>
      </section>
    );
  }

  if (!valueBets || valueBets.length === 0) return null;

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="display-font text-xl text-white tracking-wide">
            APUESTAS DE VALOR PREMIUM
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Partidos con índice de confianza &gt;75% — Algoritmo Monte Carlo 10,000 iteraciones
          </p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          IA ACTIVA
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        {valueBets.map((match, idx) => (
          <ValueBetCard
            key={match.matchId || idx}
            match={match}
            rank={idx + 1}
            onAnalyze={onAnalyze}
          />
        ))}
      </div>
    </section>
  );
}

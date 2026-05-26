import React, { useEffect, useRef, useState } from "react";

// ─── HELPERS (mismos que MatchList para coherencia) ───────────────────────────
function getTeamName(team) {
  if (!team) return "Desconocido";
  if (typeof team === "string") return team;
  if (typeof team === "object") return team.name || team.nombre || "Desconocido";
  return String(team);
}

function getCompetitionName(match) {
  return (
    match.competición?.nombre ||
    match.competition?.name   ||
    match.competicion?.nombre ||
    match.league?.name        ||
    (typeof match.competition === "string" ? match.competition : null) ||
    "Competición"
  );
}

function getMonteCarloPct(match) {
  const mc = match.monteCarlo;
  if (!mc) return { home: null, draw: null, away: null };
  return {
    home:  mc["Victoria local"]     ?? mc.homeWin ?? null,
    draw:  mc["empate"]             ?? mc.draw    ?? null,
    away:  mc["victoria visitante"] ?? mc.awayWin ?? null,
  };
}

function safeNum(val, decimals = 1) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n.toFixed(decimals);
}

// ─── BARRA DE PROBABILIDAD ANIMADA ────────────────────────────────────────────
function ProbBar({ label, sublabel, value, color, delay = 0 }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(value ?? 0), 120 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  if (value == null) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {sublabel && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-black"
              style={{ background: `${color}25`, color }}
            >
              {sublabel}
            </span>
          )}
          <span className="text-sm text-slate-300">{label}</span>
        </div>
        <span className="number-display text-base font-bold" style={{ color }}>
          {Number(value).toFixed(1)}%
        </span>
      </div>
      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}70, ${color})`,
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </div>
  );
}

// ─── TARJETA DE ESTADÍSTICA RÁPIDA ────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 gap-0.5">
      <span className="number-display text-xl font-bold" style={{ color: color || "#e2e8f0" }}>
        {value ?? "—"}
      </span>
      <span className="text-slate-600 text-xs text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── INDICADOR CALIDAD DE DATOS ───────────────────────────────────────────────
function DataQualityBadge({ quality }) {
  const map = {
    full:      { label: "Datos completos",  classes: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    partial:   { label: "Datos parciales",  classes: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    estimated: { label: "Datos estimados",  classes: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
  };
  const c = map[quality] || map.estimated;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${c.classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {c.label}
    </span>
  );
}

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────
export default function PredictionModal({ match, onClose }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!match) return null;

  // ── Extraer datos de forma segura ──────────────────────────────────────────
  const homeTeamName    = getTeamName(match.homeTeam);
  const awayTeamName    = getTeamName(match.awayTeam);
  const competitionName = getCompetitionName(match);

  const { home: homeWin, draw, away: awayWin } = getMonteCarloPct(match);

  const xgHome  = safeNum(match.expectedGoals?.local     ?? match.expectedGoals?.home,     2);
  const xgAway  = safeNum(match.expectedGoals?.visitante ?? match.expectedGoals?.away,     2);
  const xgTotal = xgHome != null && xgAway != null
    ? (parseFloat(xgHome) + parseFloat(xgAway)).toFixed(2)
    : null;

  const confidence   = safeNum(match.monteCarlo?.confidenceIndex ?? match.confianza, 1);
  const pronoScore   = typeof match.mostLikelyScore === "string" ? match.mostLikelyScore : null;
  const topScoreProb = safeNum(match.topScoreProb, 1);
  const pronoIA      = typeof match.pronosticoIA === "string" ? match.pronosticoIA : null;
  const dataQuality  = match.dataQuality || "estimated";

  const bttsYes = safeNum(
    match.monteCarlo?.["ambos anotan"] ?? match.monteCarlo?.bttsYes, 1
  );
  const over25 = safeNum(
    match.monteCarlo?.["over 2.5"] ?? match.monteCarlo?.over25, 1
  );
  const under25 = safeNum(
    match.monteCarlo?.["under 2.5"] ?? match.monteCarlo?.under25, 1
  );

  const iterations = match.monteCarlo?.iterations
    ? Number(match.monteCarlo.iterations).toLocaleString("es-ES")
    : "10.000";

  function handleBackdrop(e) {
    if (e.target === backdropRef.current) onClose();
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: "rgba(8,15,28,0.88)", backdropFilter: "blur(8px)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-scale-in"
        style={{
          background: "linear-gradient(160deg, #0f172a 0%, #0b1322 100%)",
          border: "1px solid rgba(51,65,85,0.6)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(52,211,153,0.05)",
        }}
      >
        {/* ── CABECERA ────────────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 px-5 pt-5 pb-4 border-b border-slate-800/60"
          style={{ background: "linear-gradient(160deg,#0f172a,#0b1322)" }}
        >
          {/* Drag handle móvil */}
          <div className="flex justify-center mb-3 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-slate-700" />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-slate-500 text-xs uppercase tracking-widest truncate">
                  {competitionName}
                </span>
                <DataQualityBadge quality={dataQuality} />
              </div>

              <h2 className="display-font text-2xl text-white tracking-wide leading-tight">
                {homeTeamName}
                <span className="text-slate-600 mx-2 text-xl">vs</span>
                {awayTeamName}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-600">
                <span>
                  Monte Carlo:{" "}
                  <span className="text-slate-400 number-display">{iterations}</span> iter.
                </span>
                {xgHome != null && (
                  <span>
                    xG local:{" "}
                    <span className="text-emerald-400 number-display">{xgHome}</span>
                  </span>
                )}
                {xgAway != null && (
                  <span>
                    xG visitante:{" "}
                    <span className="text-emerald-400 number-display">{xgAway}</span>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── CUERPO ──────────────────────────────────────────────────────── */}
        <div className="p-5 space-y-5">

          {/* Métricas rápidas */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Índice de confianza"
              value={confidence != null ? `${confidence}%` : "—"}
              color={
                confidence == null ? "#64748b"
                  : Number(confidence) >= 75 ? "#34d399"
                  : Number(confidence) >= 55 ? "#fbbf24"
                  : "#f87171"
              }
            />
            <StatCard
              label="Resultado Poisson"
              value={pronoScore ?? "—"}
              color="#34d399"
            />
            <StatCard
              label="Prob. marcador"
              value={topScoreProb != null ? `${topScoreProb}%` : "—"}
              color="#94a3b8"
            />
          </div>

          {/* Resultado 1X2 */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(15,23,42,0.6)",
              border: "1px solid rgba(51,65,85,0.4)",
            }}
          >
            <h3 className="display-font text-sm text-slate-500 tracking-widest mb-4">
              RESULTADO FINAL — 1 X 2
            </h3>
            <ProbBar label={`${homeTeamName} gana`}    sublabel="1" value={homeWin} color="#60a5fa" delay={0}   />
            <ProbBar label="Empate"                     sublabel="X" value={draw}    color="#94a3b8" delay={120} />
            <ProbBar label={`${awayTeamName} gana`}    sublabel="2" value={awayWin} color="#a78bfa" delay={240} />
          </div>

          {/* Mercados secundarios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Ambos anotan + Over/Under */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(51,65,85,0.4)",
              }}
            >
              <h3 className="display-font text-sm text-slate-500 tracking-widest mb-4">
                AMBOS ANOTAN (BTTS)
              </h3>
              <ProbBar label="Sí"  value={bttsYes}                                          color="#34d399" delay={350} />
              <ProbBar label="No"  value={bttsYes != null ? (100 - Number(bttsYes)).toFixed(1) : null} color="#f87171" delay={450} />
            </div>

            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(15,23,42,0.6)",
                border: "1px solid rgba(51,65,85,0.4)",
              }}
            >
              <h3 className="display-font text-sm text-slate-500 tracking-widest mb-4">
                TOTAL GOLES (2.5)
              </h3>
              <ProbBar label="Over 2.5"  value={over25}  color="#fbbf24" delay={350} />
              <ProbBar label="Under 2.5" value={under25} color="#64748b" delay={450} />
              {xgTotal && (
                <p className="text-xs text-slate-600 mt-1">
                  xG combinado:{" "}
                  <span className="text-slate-400 number-display">{xgTotal}</span> goles proyectados
                </p>
              )}
            </div>
          </div>

          {/* Análisis IA */}
          {pronoIA && (
            <div
              className="rounded-xl p-4"
              style={{
                background: "linear-gradient(135deg, rgba(6,78,59,0.2) 0%, rgba(15,23,42,0.7) 100%)",
                border: "1px solid rgba(52,211,153,0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex items-center justify-center w-6 h-6 rounded-lg"
                  style={{ background: "rgba(52,211,153,0.15)" }}
                >
                  <span className="text-sm">🤖</span>
                </div>
                <h3 className="display-font text-sm text-emerald-400 tracking-widest">
                  ANÁLISIS PREDICTIVO IA
                </h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {pronoIA}
              </p>
            </div>
          )}

          {/* Aviso de responsabilidad */}
          <p className="text-center text-xs text-slate-700 pb-1 leading-relaxed">
            Las predicciones son estimaciones estadísticas basadas en modelos matemáticos.
            <br />No constituyen asesoramiento financiero. Juega responsablemente.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import RecommendedBets from "./components/RecommendedBets";
import MatchList from "./components/MatchList";
import PredictionModal from "./components/PredictionModal";

// ─── API CLIENT ───────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

async function fetchMatches(date) {
  const response = await fetch(`${API_BASE}/api/matches?date=${date}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Error de red" }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// ─── DATE UTILS ───────────────────────────────────────────────────────────────
function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ date, onDateChange, totalMatches, loading }) {
  return (
    <header className="border-b border-slate-800/60" style={{ background: "rgba(8,15,28,0.9)", backdropFilter: "blur(12px)" }}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #059669, #034d36)",
                boxShadow: "0 0 20px rgba(52,211,153,0.3)",
              }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="display-font text-2xl text-white tracking-widest leading-none">
                AIRON<span className="text-emerald-400">-PRONO</span>
              </div>
              <div className="text-slate-600 text-xs tracking-widest">
                ANÁLISIS PREDICTIVO · MONTE CARLO · POISSON
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="hidden lg:flex items-center gap-6 ml-4 pl-4 border-l border-slate-800">
            <div className="text-center">
              <div className="number-display text-lg font-bold text-emerald-400">
                {loading ? "—" : totalMatches}
              </div>
              <div className="text-slate-600 text-xs">PARTIDOS</div>
            </div>
            <div className="text-center">
              <div className="number-display text-lg font-bold text-slate-300">10K</div>
              <div className="text-slate-600 text-xs">ITERACIONES</div>
            </div>
            <div className="text-center">
              <div className="number-display text-lg font-bold text-slate-300">v4</div>
              <div className="text-slate-600 text-xs">API FOOTBALL</div>
            </div>
          </div>

          {/* Date picker */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-slate-400 text-sm capitalize">{formatDisplayDate(date)}</div>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer number-display"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── ERROR BANNER ─────────────────────────────────────────────────────────────
function ErrorBanner({ error, onRetry }) {
  const isRateLimit = error?.includes("429") || error?.includes("rate limit");
  const isApiKey = error?.includes("403") || error?.includes("API key");

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 animate-slide-up">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-red-300 font-semibold text-sm">
            {isRateLimit
              ? "Límite de API alcanzado"
              : isApiKey
              ? "Error de autenticación"
              : "Error al cargar partidos"}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            {isRateLimit
              ? "El plan gratuito de football-data.org tiene límite de 10 req/min. Espera un momento e intenta de nuevo."
              : isApiKey
              ? "Verifica que FOOTBALL_API_KEY esté configurado correctamente en el backend."
              : error}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-all"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

// ─── BACKGROUND DECORATION ────────────────────────────────────────────────────
function BackgroundDecoration() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Top gradient orb */}
      <div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          top: -200,
          right: -100,
          background: "radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)",
        }}
      />
      {/* Bottom left orb */}
      <div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          bottom: 100,
          left: -100,
          background: "radial-gradient(circle, rgba(96,165,250,0.03) 0%, transparent 70%)",
        }}
      />
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(51,65,85,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [date, setDate] = useState(toLocalDateString(new Date()));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const loadMatches = useCallback(async (targetDate) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMatches(targetDate);
      setData(result);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches(date);
  }, [date, loadMatches]);

  function handleDateChange(newDate) {
    if (newDate) setDate(newDate);
  }

  function handleAnalyze(match) {
    setSelectedMatch(match);
  }

  function handleCloseModal() {
    setSelectedMatch(null);
  }

  return (
    <div className="relative min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <BackgroundDecoration />

      {/* Sticky Header */}
      <div className="sticky top-0 z-30">
        <Header
          date={date}
          onDateChange={handleDateChange}
          totalMatches={data?.totalMatches || 0}
          loading={loading}
        />
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Error state */}
        {error && !loading && (
          <div className="mb-8">
            <ErrorBanner error={error} onRetry={() => loadMatches(date)} />
          </div>
        )}

        {/* Value Bets section */}
        {(!error || data) && (
          <RecommendedBets
            valueBets={data?.valueBets || []}
            onAnalyze={handleAnalyze}
            loading={loading}
          />
        )}

        {/* League Averages strip */}
        {data?.leagueAverages && !loading && (
          <div className="flex items-center gap-4 mb-6 text-xs text-slate-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Promedio de goles del día —{" "}
              Local:{" "}
              <span className="text-slate-400 number-display">{data.leagueAverages.home}</span>{" "}
              | Visitante:{" "}
              <span className="text-slate-400 number-display">{data.leagueAverages.away}</span>
            </span>
            <span className="ml-auto text-slate-700">
              Actualizado:{" "}
              {data.generatedAt
                ? new Date(data.generatedAt).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--"}
            </span>
          </div>
        )}

        {/* Match list */}
        {(!error || data) && (
          <MatchList
            matches={data?.matches || []}
            loading={loading}
            onAnalyze={handleAnalyze}
          />
        )}

        {/* Empty state when no error and no loading */}
        {!loading && !error && data && data.totalMatches === 0 && (
          <div className="text-center py-20 text-slate-600 animate-fade-in">
            <div className="text-6xl mb-4">⚽</div>
            <p className="display-font text-2xl text-slate-500">Sin partidos este día</p>
            <p className="text-sm mt-2">Prueba con otra fecha del calendario</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/40 py-6 mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
          <span>
            <span className="display-font text-slate-600">AIRON-PRONO</span> — Motor predictivo basado en Poisson + Monte Carlo
          </span>
          <span>
            Datos: <a href="https://www.football-data.org" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-400 transition-colors">football-data.org</a>
            {" "}· Las predicciones son herramientas estadísticas, no consejos de apuesta.
          </span>
        </div>
      </footer>

      {/* Modal */}
      {selectedMatch && (
        <PredictionModal match={selectedMatch} onClose={handleCloseModal} />
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import RecommendedBets from "./components/RecommendedBets";
import MatchList from "./components/MatchList";
import PredictionModal from "./components/PredictionModal";
import Pronosticos from "./components/Pronosticos";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

async function fetchMatches(date) {
  const response = await fetch(`${API_BASE}/api/matches?date=${date}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Error de red" }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  return response.json();
}

function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr) {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

const Icons = {
  matches: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 8l4 4-4 4-4-4 4-4z"/>
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>
    </svg>
  ),
  pronosticos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  favoritos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  filtro: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  machine: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  apuestas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <path d="M1 10h22"/>
    </svg>
  ),
};

function BottomNav({ active, onChange }) {
  const tabs = [
    { id: "partidos",    label: "Partidos",    icon: Icons.matches },
    { id: "pronosticos", label: "Pronósticos", icon: Icons.pronosticos },
    { id: "favoritos",   label: "Favoritos",   icon: Icons.favoritos },
    { id: "filtro",      label: "Filtro",      icon: Icons.filtro },
    { id: "machine",     label: "Machine",     icon: Icons.machine },
    { id: "apuestas",    label: "Apuestas",    icon: Icons.apuestas },
  ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "rgba(8,12,22,0.97)",
      borderTop: "1px solid rgba(52,211,153,0.12)",
      backdropFilter: "blur(20px)",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-around", padding: "6px 0 4px" }}>
        {tabs.map(tab => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 3, padding: "6px 8px", border: "none", background: "transparent",
                cursor: "pointer", minWidth: 48, position: "relative",
                transition: "all 0.2s ease",
              }}
            >
              {isActive && (
                <span style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: 28, height: 2, borderRadius: 2,
                  background: "linear-gradient(90deg, #059669, #34d399)",
                  boxShadow: "0 0 8px rgba(52,211,153,0.6)",
                }}/>
              )}
              <span style={{
                width: 22, height: 22,
                color: isActive ? "#34d399" : "#475569",
                transition: "color 0.2s",
                filter: isActive ? "drop-shadow(0 0 4px rgba(52,211,153,0.5))" : "none",
              }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 600, letterSpacing: "0.04em",
                color: isActive ? "#34d399" : "#475569",
                transition: "color 0.2s",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {tab.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Header({ date, onDateChange, totalMatches, loading, activeTab }) {
  const tabTitles = {
    partidos:    "Partidos del Día",
    pronosticos: "Pronósticos",
    favoritos:   "Mis Favoritos",
    filtro:      "Filtros",
    machine:     "Machine Learning",
    apuestas:    "Apuestas de Valor",
  };

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "rgba(6,10,19,0.95)",
      borderBottom: "1px solid rgba(51,65,85,0.4)",
      backdropFilter: "blur(16px)",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px 0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #059669 0%, #034d36 100%)",
            boxShadow: "0 0 16px rgba(52,211,153,0.35)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: 15, fontWeight: 800, letterSpacing: "0.12em",
              color: "white", lineHeight: 1, fontFamily: "'DM Sans', sans-serif",
            }}>
              AIRON<span style={{ color: "#34d399" }}>-PRONO</span>
            </div>
            <div style={{ fontSize: 8, color: "#334155", letterSpacing: "0.15em", marginTop: 1 }}>
              MONTE CARLO · POISSON
            </div>
          </div>
        </div>
        <div style={{
          background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
          borderRadius: 20, padding: "3px 10px", display: "flex", alignItems: "center", gap: 5,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399" }}/>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#34d399", fontFamily: "monospace" }}>
            {loading ? "—" : totalMatches} partidos
          </span>
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px 10px",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "white", fontFamily: "'DM Sans', sans-serif" }}>
            {tabTitles[activeTab]}
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 1, textTransform: "capitalize" }}>
            {formatDisplayDate(date)}
          </div>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          style={{
            background: "rgba(30,41,59,0.8)", border: "1px solid rgba(71,85,105,0.5)",
            borderRadius: 8, color: "#94a3b8", fontSize: 12, padding: "6px 10px",
            outline: "none", fontFamily: "monospace", cursor: "pointer",
          }}
        />
      </div>
    </header>
  );
}

function ErrorBanner({ error, onRetry }) {
  return (
    <div style={{
      margin: "16px", borderRadius: 12, padding: 16,
      background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: "#f87171", fontWeight: 600, fontSize: 13, margin: 0 }}>Error al cargar partidos</p>
          <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>{error}</p>
        </div>
        <button onClick={onRetry} style={{
          padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(52,211,153,0.3)",
          background: "transparent", color: "#34d399", fontSize: 11, fontWeight: 600, cursor: "pointer",
        }}>
          Reintentar
        </button>
      </div>
    </div>
  );
}

function PlaceholderTab({ icon, title, subtitle }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "50vh", gap: 16, padding: 32, textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 18, fontFamily: "'DM Sans', sans-serif" }}>
          {title}
        </div>
        <div style={{ color: "#475569", fontSize: 13, marginTop: 6 }}>{subtitle}</div>
      </div>
      <div style={{
        padding: "6px 16px", borderRadius: 20,
        background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
        color: "#34d399", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
      }}>
        PRÓXIMAMENTE
      </div>
    </div>
  );
}

function Background() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{
        position: "absolute", width: 500, height: 500, top: -150, right: -100, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(52,211,153,0.045) 0%, transparent 70%)",
      }}/>
      <div style={{
        position: "absolute", width: 350, height: 350, bottom: 80, left: -80, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(96,165,250,0.03) 0%, transparent 70%)",
      }}/>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.25,
        backgroundImage: "linear-gradient(rgba(51,65,85,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.12) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
      }}/>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab]         = useState("partidos");
  const [date, setDate]                   = useState(toLocalDateString(new Date()));
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const loadMatches = useCallback(async (targetDate) => {
    setLoading(true); setError(null);
    try {
      const result = await fetchMatches(targetDate);
      setData(result);
    } catch (err) {
      setError(err.message); setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMatches(date); }, [date, loadMatches]);

  function handleDateChange(newDate) { if (newDate) setDate(newDate); }
  function handleAnalyze(match)      { setSelectedMatch(match); }
  function handleCloseModal()        { setSelectedMatch(null); }

  function renderContent() {
    switch (activeTab) {
      case "partidos":
        return (
          <>
            {error && !loading && <ErrorBanner error={error} onRetry={() => loadMatches(date)} />}
            {(!error || data) && (
              <RecommendedBets valueBets={data?.valueBets || []} onAnalyze={handleAnalyze} loading={loading} />
            )}
            {(!error || data) && (
              <MatchList matches={data?.matches || []} loading={loading} onAnalyze={handleAnalyze} />
            )}
            {!loading && !error && data && (data.total === 0 || data.matches?.length === 0) && (
              <div style={{ textAlign: "center", padding: "60px 32px", color: "#475569" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#64748b" }}>Sin partidos este día</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Prueba con otra fecha</div>
              </div>
            )}
          </>
        );
      case "pronosticos":
        return (
          <Pronosticos matches={data?.matches || []} loading={loading} />
        );
      case "favoritos":
        return <PlaceholderTab icon="⭐" title="Mis Favoritos" subtitle="Guarda los partidos que más te interesan" />;
      case "filtro":
        return <PlaceholderTab icon="🎯" title="Filtros" subtitle="Filtra por liga, probabilidad mínima o mercado" />;
      case "machine":
        return <PlaceholderTab icon="🤖" title="Machine Learning" subtitle="Motor predictivo Poisson + Monte Carlo en detalle" />;
      case "apuestas":
        return <PlaceholderTab icon="💎" title="Apuestas de Valor" subtitle="Value bets con edge positivo detectado por el modelo" />;
      default:
        return null;
    }
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#060a13" }}>
      <Background />
      <div style={{ position: "relative", zIndex: 10 }}>
        <Header
          date={date}
          onDateChange={handleDateChange}
          totalMatches={data?.total || data?.matches?.length || 0}
          loading={loading}
          activeTab={activeTab}
        />
        <main style={{ padding: "12px 0 90px" }}>
          {renderContent()}
        </main>
        {activeTab === "partidos" && (
          <footer style={{
            borderTop: "1px solid rgba(51,65,85,0.3)", padding: "16px",
            marginBottom: 80, textAlign: "center",
          }}>
            <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>
              AIRON-PRONO — Motor predictivo Poisson + Monte Carlo ·{" "}
              <a href="https://www.football-data.org" target="_blank" rel="noreferrer" style={{ color: "#475569" }}>
                football-data.org
              </a>
            </p>
          </footer>
        )}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
      {selectedMatch && <PredictionModal match={selectedMatch} onClose={handleCloseModal} />}
    </div>
  );
}

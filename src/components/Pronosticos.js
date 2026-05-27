import React, { useState, useEffect } from "react";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getTeamName(team) {
  if (!team) return "Desconocido";
  if (typeof team === "string") return team;
  return team.name || team.nombre || "Desconocido";
}

function getCompetitionName(match) {
  return (
    match.competition?.name ||
    match.competicion?.nombre ||
    match.competición?.nombre ||
    "Competición"
  );
}

// Selecciona los 2 partidos con mayor diferencial de probabilidad (más "decididos")
function getTopMatches(matches) {
  if (!matches || matches.length === 0) return [];
  return [...matches]
    .filter(m => m._analyzed)
    .map(m => {
      const a = m._analyzed;
      const maxProb = Math.max(a.homeWin || 0, a.awayWin || 0, a.draw || 0);
      const sorted = [a.homeWin || 0, a.awayWin || 0, a.draw || 0].sort((x, y) => y - x);
      const differential = sorted[0] - sorted[1];
      return { ...m, _maxProb: maxProb, _differential: differential };
    })
    .sort((a, b) => b._differential - a._differential)
    .slice(0, 2);
}

// Decide la recomendación de apuesta principal
function getApuestaRecomendada(match) {
  const a = match._analyzed || {};
  const homeWin = a.homeWin || 0;
  const awayWin = a.awayWin || 0;
  const draw    = a.draw    || 0;
  const xGTotal = (a.xGHome || 0) + (a.xGAway || 0);
  const homeName = getTeamName(match.homeTeam);
  const awayName = getTeamName(match.awayTeam);

  if (homeWin > 50 && xGTotal >= 2.5)
    return { mercado: "Victoria Local + Más de 2.5", equipo: homeName, color: "#60a5fa", prob: homeWin };
  if (awayWin > 50 && xGTotal >= 2.5)
    return { mercado: "Victoria Visitante + Más de 2.5", equipo: awayName, color: "#a78bfa", prob: awayWin };
  if (homeWin > 45)
    return { mercado: "DNB (Draw No Bet)", equipo: homeName, color: "#60a5fa", prob: homeWin };
  if (awayWin > 45)
    return { mercado: "DNB (Draw No Bet)", equipo: awayName, color: "#a78bfa", prob: awayWin };
  if (xGTotal < 2.2)
    return { mercado: "Menos de 2.5 Goles", equipo: null, color: "#fbbf24", prob: Math.round(100 - xGTotal * 20) };
  if (draw > 33)
    return { mercado: "Doble Oportunidad 1X o X2", equipo: null, color: "#34d399", prob: Math.round(homeWin + draw) };
  return { mercado: "Doble Oportunidad", equipo: null, color: "#34d399", prob: Math.round(homeWin + draw) };
}

// ─── BARRA DE PROB ANIMADA ────────────────────────────────────────────────────
function ProbBar({ label, value, color, sublabel }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value || 0), 200);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>
          {sublabel && <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 18, height: 18, borderRadius: 4, fontSize: 10, fontWeight: 800,
            background: `${color}22`, color, marginRight: 6,
          }}>{sublabel}</span>}
          {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "monospace" }}>
          {Number(value || 0).toFixed(1)}%
        </span>
      </div>
      <div style={{ height: 6, background: "rgba(51,65,85,0.5)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}60, ${color})`,
          transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
        }}/>
      </div>
    </div>
  );
}

// ─── TARJETA DE PRONÓSTICO ────────────────────────────────────────────────────
function PronosticoCard({ match, rank }) {
  const a           = match._analyzed || {};
  const homeName    = getTeamName(match.homeTeam);
  const awayName    = getTeamName(match.awayTeam);
  const competition = getCompetitionName(match);
  const apuesta     = getApuestaRecomendada(match);
  const xGTotal     = ((a.xGHome || 0) + (a.xGAway || 0)).toFixed(2);
  const pronoTexto  = match.pronosticoIA || "";
  const parrafos    = pronoTexto.split("\n\n").filter(Boolean);

  const isLive     = match.status === "LIVE" || match.status === "IN_PLAY";
  const isFinished = match.status === "FINISHED";

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden", marginBottom: 20,
      border: "1px solid rgba(51,65,85,0.5)",
      background: "linear-gradient(160deg, rgba(15,23,42,0.95) 0%, rgba(8,12,22,0.98) 100%)",
      boxShadow: rank === 1
        ? "0 0 30px rgba(52,211,153,0.08), 0 8px 32px rgba(0,0,0,0.4)"
        : "0 8px 24px rgba(0,0,0,0.3)",
    }}>

      {/* Top accent line */}
      <div style={{
        height: 3,
        background: rank === 1
          ? "linear-gradient(90deg, #059669, #34d399)"
          : "linear-gradient(90deg, #3730a3, #818cf8)",
      }}/>

      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(51,65,85,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8, display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
              background: rank === 1 ? "#059669" : "#3730a3",
              color: "white", fontFamily: "'DM Sans', sans-serif",
            }}>
              #{rank}
            </div>
            <span style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.06em" }}>
              {competition}
            </span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: isLive ? "rgba(239,68,68,0.15)" : isFinished ? "rgba(71,85,105,0.3)" : "rgba(59,130,246,0.12)",
            color: isLive ? "#f87171" : isFinished ? "#64748b" : "#60a5fa",
            border: `1px solid ${isLive ? "rgba(239,68,68,0.25)" : isFinished ? "rgba(71,85,105,0.4)" : "rgba(59,130,246,0.2)"}`,
          }}>
            {isLive ? "🔴 EN VIVO" : isFinished ? "FINALIZADO" : match.utcDate ? new Date(match.utcDate).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "PROGRAMADO"}
          </span>
        </div>

        {/* Equipos */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ flex: 1, textAlign: "right", fontWeight: 700, fontSize: 15, color: "white" }}>
            {homeName}
          </span>
          <div style={{
            background: "rgba(8,12,22,0.8)", border: "1px solid rgba(52,211,153,0.2)",
            borderRadius: 8, padding: "6px 14px", minWidth: 56, textAlign: "center",
          }}>
            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 15, color: "#34d399" }}>
              {match.score?.fullTime?.home != null
                ? `${match.score.fullTime.home}–${match.score.fullTime.away}`
                : "VS"}
            </span>
          </div>
          <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: "white" }}>
            {awayName}
          </span>
        </div>
      </div>

      {/* Probabilidades 1X2 */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(51,65,85,0.2)" }}>
        <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em", marginBottom: 12 }}>
          PROBABILIDADES DEL MODELO
        </div>
        <ProbBar label={homeName}  sublabel="1" value={a.homeWin} color="#60a5fa" />
        <ProbBar label="Empate"    sublabel="X" value={a.draw}    color="#94a3b8" />
        <ProbBar label={awayName}  sublabel="2" value={a.awayWin} color="#a78bfa" />
        <div style={{ marginTop: 8, fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
          xG Total proyectado: <span style={{ color: "#64748b" }}>{xGTotal}</span> goles
        </div>
      </div>

      {/* Apuesta recomendada */}
      <div style={{
        margin: "12px 16px",
        borderRadius: 10,
        padding: "12px 14px",
        background: `linear-gradient(135deg, ${apuesta.color}10 0%, rgba(8,12,22,0.6) 100%)`,
        border: `1px solid ${apuesta.color}30`,
      }}>
        <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.12em", marginBottom: 6 }}>
          APUESTA SUGERIDA POR EL MODELO
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: apuesta.color, fontFamily: "'DM Sans', sans-serif" }}>
              {apuesta.mercado}
            </div>
            {apuesta.equipo && (
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Equipo: <span style={{ color: "#94a3b8" }}>{apuesta.equipo}</span>
              </div>
            )}
          </div>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            background: `${apuesta.color}15`, borderRadius: 10, padding: "6px 12px",
            border: `1px solid ${apuesta.color}25`,
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: apuesta.color, fontFamily: "monospace" }}>
              {Number(apuesta.prob).toFixed(0)}%
            </span>
            <span style={{ fontSize: 9, color: "#475569" }}>PROB.</span>
          </div>
        </div>
      </div>

      {/* Análisis IA expandido */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{
          borderRadius: 10,
          background: "rgba(6,78,59,0.12)",
          border: "1px solid rgba(52,211,153,0.15)",
          padding: "12px 14px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
            fontSize: 9, color: "#34d399", letterSpacing: "0.12em", fontWeight: 700,
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 5, background: "rgba(52,211,153,0.15)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10,
            }}>🤖</span>
            ANÁLISIS PREDICTIVO IA
          </div>

          {parrafos.length > 0 ? parrafos.map((p, i) => (
            <p key={i} style={{
              fontSize: 12, color: "#94a3b8", lineHeight: 1.7,
              margin: i < parrafos.length - 1 ? "0 0 10px 0" : 0,
              paddingBottom: i < parrafos.length - 1 ? 10 : 0,
              borderBottom: i < parrafos.length - 1 ? "1px solid rgba(51,65,85,0.2)" : "none",
            }}>
              {p}
            </p>
          )) : (
            <p style={{ fontSize: 12, color: "#475569", margin: 0, fontStyle: "italic" }}>
              Análisis no disponible para este partido.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: "0 16px" }}>
      {[1, 2].map(i => (
        <div key={i} style={{
          borderRadius: 16, marginBottom: 20, height: 420,
          background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)",
          animation: "pulse 1.8s ease-in-out infinite",
        }}/>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Pronosticos({ matches, loading }) {
  const topMatches = getTopMatches(matches);

  if (loading) return <Skeleton />;

  if (!matches || matches.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 32px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#64748b" }}>Sin partidos para analizar</div>
        <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>
          Selecciona una fecha con partidos disponibles
        </div>
      </div>
    );
  }

  if (topMatches.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 32px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#64748b" }}>Motor calculando</div>
        <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>
          Los datos del modelo aún no están disponibles
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
          }}>📈</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "white", fontFamily: "'DM Sans', sans-serif" }}>
              Top 2 Partidos del Día
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>
              Mayor diferencial de probabilidad · Análisis IA completo
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: "0 16px" }}>
        {topMatches.map((match, idx) => (
          <PronosticoCard key={match.id || idx} match={match} rank={idx + 1} />
        ))}
      </div>

      {/* Disclaimer */}
      <p style={{ textAlign: "center", fontSize: 10, color: "#1e293b", padding: "0 24px 24px" }}>
        Las predicciones son estimaciones estadísticas. No constituyen asesoramiento financiero.
      </p>
    </div>
  );
}

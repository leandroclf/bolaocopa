"use client";

import { useMemo, useState } from "react";
import type { Bracket, BracketMatch, BracketParticipant, KnockoutPhaseKey, Side } from "@/knockout/types";

const fmtDay = (d: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${d}T12:00:00`));

const statusLabel: Record<BracketMatch["status"], string> = {
  finished: "Encerrado",
  scheduled: "Definido",
  pending: "Aguardando",
};

function Participant({ side, match }: { side: Side; match: BracketMatch }) {
  const p: BracketParticipant = match[side];
  const isWinner = match.winner === side;
  const goals = side === "home" ? match.homeGoals : match.awayGoals;
  const resolved = Boolean(p.team);

  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2.5 py-2 ${
        isWinner ? "bg-lime/10" : "bg-pitch"
      }`}
    >
      <span className="w-6 shrink-0 text-center text-base leading-none">{p.team?.flag ?? "·"}</span>
      <span
        className={`min-w-0 flex-1 truncate text-sm ${
          isWinner ? "font-semibold text-lime" : resolved ? "text-chalk" : "italic text-slatey"
        }`}
      >
        {p.label}
      </span>
      {goals !== null && (
        <span className={`font-mono text-sm font-bold ${isWinner ? "text-lime" : "text-chalk"}`}>{goals}</span>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: BracketMatch }) {
  const when = match.date ? fmtDay(match.date) + (match.time ? ` · ${match.time}` : "") : null;
  return (
    <div className="rounded-lg border border-pitch-line bg-pitch-2 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slatey">
          Jogo {match.matchNumber}
          {when ? ` · ${when}` : ""}
        </span>
        <span
          className={`font-mono text-[10px] uppercase tracking-wider ${
            match.status === "finished" ? "text-slatey" : match.status === "scheduled" ? "text-info" : "text-slatey/70"
          }`}
        >
          {statusLabel[match.status]}
        </span>
      </div>
      <div className="grid gap-1">
        <Participant side="home" match={match} />
        <Participant side="away" match={match} />
      </div>
    </div>
  );
}

export default function BracketView({ bracket }: { bracket: Bracket | null }) {
  const phases = bracket?.phases ?? [];
  const [active, setActive] = useState<KnockoutPhaseKey>(phases[0]?.key ?? "R32");
  const current = useMemo(() => phases.find((p) => p.key === active) ?? phases[0] ?? null, [phases, active]);

  const champion = useMemo(() => {
    const final = phases.find((p) => p.key === "F")?.matches[0];
    return final?.winner ? final[final.winner].team : null;
  }, [phases]);

  if (!bracket || phases.length === 0) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-8">
        <p className="rounded-lg border border-dashed border-pitch-line bg-pitch-2 px-4 py-6 text-center text-sm text-slatey">
          O chaveamento aparece assim que a fase de grupos avançar.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-5">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="font-display text-xl uppercase tracking-widest text-chalk">Chaveamento</h2>
        <p className="font-mono text-[10px] uppercase tracking-wider text-slatey">
          {bracket.groupsComplete ? "mata-mata" : "fase de grupos em andamento"}
        </p>
      </div>

      {champion && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3">
          <span className="text-2xl leading-none">{champion.flag}</span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold/80">campeão</p>
            <p className="font-display text-xl uppercase tracking-wide text-gold">{champion.name}</p>
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg border border-pitch-line bg-pitch-2 p-1 sm:grid-cols-6">
        {phases.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActive(p.key)}
            aria-pressed={active === p.key}
            className={`h-9 rounded-md px-1 font-mono text-[10px] uppercase tracking-wider ${
              active === p.key ? "bg-lime text-pitch" : "text-slatey hover:text-chalk"
            }`}
          >
            {p.shortLabel}
          </button>
        ))}
      </div>

      {current && (
        <>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-info">{current.label}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {current.matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

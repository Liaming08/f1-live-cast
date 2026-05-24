import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOpenF1Sessions,
  useGetOpenF1Live,
  useGetOpenF1Qualifying,
  useGetOpenF1Practice,
  getGetOpenF1LiveQueryKey,
  getGetOpenF1QualifyingQueryKey,
  getGetOpenF1PracticeQueryKey,
  getListOpenF1SessionsQueryKey,
} from "@workspace/api-client-react";
import {
  formatOpenF1LapTime,
  formatSectorTime,
  getTireColor,
  getTireInitial,
  getRaceControlBg,
} from "@/lib/formatters";
import { TireBadge } from "@/components/tire-badge";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, Zap, Flag, Timer, Gauge, Wind, Droplets,
  ChevronDown, Radio, AlertTriangle, Clock, BarChart2
} from "lucide-react";

type SessionMode = "Race" | "Qualifying" | "Sprint_Qualifying" | "Sprint" | "Practice" | "Practice_1" | "Practice_2" | "Practice_3";

interface OF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  circuit_short_name: string;
  country_name: string;
  location: string;
  date_start: string;
  year: number;
  meeting_key: number;
}

function sessionBadgeClass(type: string): string {
  if (type === "Race") return "bg-red-600 text-white";
  if (type === "Sprint") return "bg-orange-500 text-white";
  if (type.includes("Qualifying")) return "bg-violet-600 text-white";
  if (type.includes("Practice")) return "bg-sky-700 text-white";
  return "bg-zinc-700 text-white";
}

function sessionIcon(type: string) {
  if (type === "Race" || type === "Sprint") return <Flag className="w-3 h-3" />;
  if (type.includes("Qualifying")) return <Timer className="w-3 h-3" />;
  return <Gauge className="w-3 h-3" />;
}

function sessionLabel(type: string, name: string): string {
  return name.toUpperCase();
}

function positionStyle(pos: number): string {
  if (pos === 1) return "text-yellow-400 font-black";
  if (pos <= 3) return "text-zinc-200 font-bold";
  if (pos <= 10) return "text-zinc-300 font-semibold";
  return "text-zinc-500 font-medium";
}

// ─── Weather widget ─────────────────────────────────────────────────────────
function WeatherWidget({ weather }: { weather: { air_temperature?: number | null; track_temperature?: number | null; wind_speed?: number | null; humidity?: number | null; rainfall?: number | null } | null | undefined }) {
  if (!weather) return null;
  return (
    <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400 border border-zinc-800 rounded-lg px-3 py-2 bg-zinc-950/60">
      <span className="flex items-center gap-1">
        <span className="text-zinc-500">AIR</span>
        <span className="text-white">{weather.air_temperature?.toFixed(1) ?? "—"}°</span>
      </span>
      <span className="flex items-center gap-1">
        <span className="text-zinc-500">TRK</span>
        <span className="text-orange-300">{weather.track_temperature?.toFixed(1) ?? "—"}°</span>
      </span>
      <span className="flex items-center gap-1">
        <Wind className="w-3 h-3 text-zinc-500" />
        <span className="text-white">{weather.wind_speed?.toFixed(1) ?? "—"} m/s</span>
      </span>
      <span className="flex items-center gap-1">
        <Droplets className="w-3 h-3 text-zinc-500" />
        <span className={weather.rainfall && weather.rainfall > 0 ? "text-blue-400" : "text-white"}>
          {weather.humidity?.toFixed(0) ?? "—"}%
        </span>
      </span>
    </div>
  );
}

// ─── Race Control panel ──────────────────────────────────────────────────────
function RaceControlPanel({ messages }: {
  messages: { message: string; category?: string; flag?: string | null; lap_number?: number | null; date?: string }[]
}) {
  if (!messages.length) return null;
  return (
    <div className="space-y-1">
      {messages.slice(0, 8).map((m, i) => (
        <div key={i} className={cn("text-xs px-3 py-1.5 rounded border font-mono", getRaceControlBg(m.category, m.flag))}>
          {m.lap_number && <span className="opacity-60 mr-2">L{m.lap_number}</span>}
          {m.message}
        </div>
      ))}
    </div>
  );
}

// ─── Session Picker ──────────────────────────────────────────────────────────
function SessionPicker({
  sessions, selected, onSelect,
}: {
  sessions: OF1Session[];
  selected: OF1Session | null;
  onSelect: (s: OF1Session) => void;
}) {
  const [open, setOpen] = useState(false);

  const grouped = sessions.reduce<Record<string, OF1Session[]>>((acc, s) => {
    const key = `${s.location} ${s.year}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-sm font-medium transition-colors"
      >
        {selected ? (
          <>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase", sessionBadgeClass(selected.session_type))}>
              {sessionLabel(selected.session_type, selected.session_name)}
            </span>
            <span className="text-zinc-300">{selected.circuit_short_name}</span>
          </>
        ) : (
          <span className="text-zinc-500">Select session…</span>
        )}
        <ChevronDown className="w-4 h-4 text-zinc-500 ml-1" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-72 max-h-96 overflow-y-auto">
          {Object.entries(grouped).reverse().map(([gp, slist]) => (
            <div key={gp}>
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800 sticky top-0 bg-zinc-900">
                {gp}
              </div>
              {slist.map(s => (
                <button
                  key={s.session_key}
                  onClick={() => { onSelect(s); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-800 transition-colors text-left",
                    selected?.session_key === s.session_key && "bg-zinc-800"
                  )}
                >
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase min-w-[40px] text-center", sessionBadgeClass(s.session_type))}>
                    {s.session_name.replace("Sprint Qualifying", "SQ").replace("Practice ", "FP").replace("Qualifying", "Q").replace("Sprint", "S").replace("Race", "R")}
                  </span>
                  <span className="text-zinc-300">{s.session_name}</span>
                  <span className="ml-auto text-zinc-600 text-[10px]">{new Date(s.date_start).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Race / Sprint timing tower ──────────────────────────────────────────────
function RaceTimingTower({ sessionKey, isLive }: { sessionKey: string; isLive: boolean }) {
  const { data, isLoading } = useGetOpenF1Live({ sessionKey });

  if (isLoading) return <TimingTableSkeleton />;
  if (!data || !data.timing?.length) return <EmptyState label="No timing data" />;

  const { timing, weather, raceControl } = data;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
      {/* Timing tower */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[40px_4px_1fr_90px_90px_70px_70px] gap-0 px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          <span className="text-center">POS</span>
          <span />
          <span>DRIVER</span>
          <span className="text-right">GAP</span>
          <span className="text-right">INTERVAL</span>
          <span className="text-center">TYRE</span>
          <span className="text-center">PITS</span>
        </div>
        <div className="divide-y divide-zinc-900">
          {timing.map((row, idx) => {
            const isLeader = row.position === 1;
            return (
              <div
                key={row.driverNumber}
                className={cn(
                  "grid grid-cols-[40px_4px_1fr_90px_90px_70px_70px] gap-0 px-3 py-2.5 items-center transition-colors hover:bg-zinc-900/40 group",
                  isLeader && "bg-yellow-500/5"
                )}
              >
                {/* Position */}
                <span className={cn("text-center font-mono text-sm font-bold", positionStyle(row.position))}>
                  {row.position}
                </span>
                {/* Team color bar */}
                <span
                  className="self-stretch w-[3px] rounded-full mx-auto"
                  style={{ backgroundColor: row.teamColor || "#555" }}
                />
                {/* Driver */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-black text-white text-sm tracking-tight">{row.abbreviation}</span>
                  <span className="text-zinc-500 text-xs hidden sm:block truncate">{row.teamName}</span>
                </div>
                {/* Gap */}
                <span className="text-right font-mono text-xs text-zinc-400">
                  {idx === 0 ? <span className="text-yellow-400 font-bold">LEADER</span> : (row.gapToLeader || "—")}
                </span>
                {/* Interval */}
                <span className="text-right font-mono text-xs text-zinc-500">
                  {idx === 0 ? "" : (row.interval || "—")}
                </span>
                {/* Tyre */}
                <span className="text-center">
                  <TireBadge compound={row.compound} age={row.tyreAge} />
                </span>
                {/* Pits - derive from stintLap roughly */}
                <span className="text-center font-mono text-xs text-zinc-500">—</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="space-y-3">
        <WeatherWidget weather={weather} />
        {raceControl && raceControl.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Race Control</span>
            </div>
            <RaceControlPanel messages={raceControl.filter(m => m.message).map(m => ({ ...m, message: m.message! }))} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Qualifying view ─────────────────────────────────────────────────────────
function QualifyingView({ sessionKey, sessionName }: { sessionKey: string; sessionName: string }) {
  const { data, isLoading } = useGetOpenF1Qualifying({ sessionKey });

  if (isLoading) return <TimingTableSkeleton />;
  if (!data || !data.results?.length) return <EmptyState label="No qualifying data" />;

  const { results } = data;
  const isQ = sessionName.includes("Qualifying");
  const isSQ = sessionName.includes("Sprint");

  const q1cutoff = isSQ ? 15 : 15;
  const q2cutoff = isSQ ? 10 : 10;

  const poleLap = results[0]?.lapTime ?? null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_4px_1fr_120px_80px_70px_70px_70px] gap-0 px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
        <span className="text-center">POS</span>
        <span />
        <span>DRIVER</span>
        <span className="text-right">BEST LAP</span>
        <span className="text-right">GAP</span>
        <span className="text-center text-violet-400">S1</span>
        <span className="text-center text-violet-400">S2</span>
        <span className="text-center text-violet-400">S3</span>
      </div>
      <div className="divide-y divide-zinc-900">
        {results.map((row, idx) => {
          const isElim1 = isQ && idx >= q1cutoff;
          const isElim2 = isQ && idx >= q2cutoff && idx < q1cutoff;
          const isPole = idx === 0;

          return (
            <div key={row.driverNumber ?? idx}>
              {/* Elimination zone dividers */}
              {isQ && idx === q2cutoff && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/40 border-y border-amber-600/30">
                  <span className="text-[9px] uppercase tracking-widest text-amber-500 font-bold">Q2 Elimination Zone</span>
                </div>
              )}
              {isQ && idx === q1cutoff && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-950/40 border-y border-red-700/30">
                  <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold">Q1 Elimination Zone</span>
                </div>
              )}
              <div className={cn(
                "grid grid-cols-[40px_4px_1fr_120px_80px_70px_70px_70px] gap-0 px-3 py-2.5 items-center transition-colors hover:bg-zinc-900/40",
                isPole && "bg-yellow-500/5",
                isElim1 && "opacity-60",
              )}>
                <span className={cn("text-center font-mono text-sm font-bold", positionStyle(row.position))}>
                  {row.position}
                </span>
                <span
                  className="self-stretch w-[3px] rounded-full mx-auto"
                  style={{ backgroundColor: row.teamColor || "#555" }}
                />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-black text-white text-sm tracking-tight">{row.abbreviation}</span>
                  <span className="text-zinc-500 text-xs hidden sm:block truncate">{row.teamName}</span>
                </div>
                <span className={cn("text-right font-mono text-sm font-bold", isPole ? "text-violet-300" : "text-zinc-200")}>
                  {formatOpenF1LapTime(row.lapTime)}
                </span>
                <span className="text-right font-mono text-xs text-zinc-500">
                  {idx === 0 ? <span className="text-violet-400 font-bold">POLE</span> : (row.gapToPole !== null && row.gapToPole !== undefined ? `+${row.gapToPole.toFixed(3)}` : "—")}
                </span>
                <span className="text-center font-mono text-xs text-zinc-400">{formatSectorTime(row.s1)}</span>
                <span className="text-center font-mono text-xs text-zinc-400">{formatSectorTime(row.s2)}</span>
                <span className="text-center font-mono text-xs text-zinc-400">{formatSectorTime(row.s3)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Practice view ───────────────────────────────────────────────────────────
function PracticeView({ sessionKey }: { sessionKey: string }) {
  const { data, isLoading } = useGetOpenF1Practice({ sessionKey });

  if (isLoading) return <TimingTableSkeleton />;
  if (!data || !data.results?.length) return <EmptyState label="No practice data" />;

  const { results } = data;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="grid grid-cols-[40px_4px_1fr_120px_80px_70px_70px_70px_50px] gap-0 px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
        <span className="text-center">POS</span>
        <span />
        <span>DRIVER</span>
        <span className="text-right">BEST LAP</span>
        <span className="text-right">GAP</span>
        <span className="text-center text-sky-400">S1</span>
        <span className="text-center text-sky-400">S2</span>
        <span className="text-center text-sky-400">S3</span>
        <span className="text-center">LAPS</span>
      </div>
      <div className="divide-y divide-zinc-900">
        {results.map((row, idx) => (
          <div
            key={row.driverNumber ?? idx}
            className="grid grid-cols-[40px_4px_1fr_120px_80px_70px_70px_70px_50px] gap-0 px-3 py-2.5 items-center transition-colors hover:bg-zinc-900/40"
          >
            <span className={cn("text-center font-mono text-sm font-bold", positionStyle(row.position))}>
              {row.position}
            </span>
            <span
              className="self-stretch w-[3px] rounded-full mx-auto"
              style={{ backgroundColor: row.teamColor || "#555" }}
            />
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono font-black text-white text-sm tracking-tight">{row.abbreviation}</span>
              <span className="text-zinc-500 text-xs hidden sm:block truncate">{row.teamName}</span>
            </div>
            <span className={cn("text-right font-mono text-sm font-bold", idx === 0 ? "text-sky-300" : "text-zinc-200")}>
              {formatOpenF1LapTime(row.lapTime)}
            </span>
            <span className="text-right font-mono text-xs text-zinc-500">
              {idx === 0 ? <span className="text-sky-400 font-bold">FASTEST</span> : (row.gap !== null && row.gap !== undefined ? `+${row.gap.toFixed(3)}` : "—")}
            </span>
            <span className="text-center font-mono text-xs text-zinc-400">{formatSectorTime(row.s1)}</span>
            <span className="text-center font-mono text-xs text-zinc-400">{formatSectorTime(row.s2)}</span>
            <span className="text-center font-mono text-xs text-zinc-400">{formatSectorTime(row.s3)}</span>
            <span className="text-center font-mono text-xs text-zinc-500">{row.lapsCompleted ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty / Skeleton ────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4 border border-zinc-800 rounded-xl">
      <Activity className="w-12 h-12 text-zinc-700" />
      <p className="text-zinc-500 uppercase tracking-widest text-sm font-bold">{label}</p>
    </div>
  );
}

function TimingTableSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden space-y-0">
      <div className="h-9 bg-zinc-900/80 border-b border-zinc-800" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="px-3 py-3 border-b border-zinc-900">
          <Skeleton className="h-5 w-full bg-zinc-800/60" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Home component ─────────────────────────────────────────────────────
export default function Home() {
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<OF1Session | null>(null);
  const [manualKey, setManualKey] = useState<string | null>(null);

  const { data: sessions2025raw } = useListOpenF1Sessions({ year: 2025 });
  const sessions2025 = (sessions2025raw ?? []) as OF1Session[];

  // Auto-select latest session (only once)
  useEffect(() => {
    if (!sessions2025.length || selectedSession) return;
    const latest = [...sessions2025].sort((a, b) =>
      new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
    )[0];
    if (latest) setSelectedSession(latest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions2025.length]);

  // Abu Dhabi 2025 Race (session 9839) as safe default while sessions load
  const sessionKey = manualKey ?? (selectedSession ? String(selectedSession.session_key) : "9839");
  const sessionType = selectedSession?.session_type ?? "Race";
  const sessionName = selectedSession?.session_name ?? "Race";

  const isRaceMode = sessionType === "Race" || sessionType === "Sprint";
  const isQualMode = sessionType === "Qualifying" || sessionType === "Sprint_Qualifying" || sessionType.includes("Qualifying");
  const isPractMode = sessionType.includes("Practice");

  // Auto-refresh
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetOpenF1LiveQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetOpenF1QualifyingQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetOpenF1PracticeQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListOpenF1SessionsQueryKey() });
  }, [queryClient]);

  useEffect(() => {
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  const now = Date.now();
  const sessionStart = selectedSession ? new Date(selectedSession.date_start).getTime() : 0;
  const isLive = Math.abs(now - sessionStart) < 3 * 60 * 60 * 1000;

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          {/* Session type badge */}
          <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest", sessionBadgeClass(sessionType))}>
            {sessionIcon(sessionType)}
            {sessionLabel(sessionType, sessionName)}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-400 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          )}
          {selectedSession && (
            <div className="text-sm text-zinc-400">
              <span className="text-white font-medium">{selectedSession.circuit_short_name}</span>
              <span className="mx-1 text-zinc-600">·</span>
              <span>{selectedSession.location}</span>
              <span className="mx-1 text-zinc-600">·</span>
              <span>{new Date(selectedSession.date_start).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          )}
        </div>

        {/* Session picker */}
        <div className="flex items-center gap-2">
          <SessionPicker
            sessions={(sessions2025 ?? []) as OF1Session[]}
            selected={selectedSession}
            onSelect={(s) => { setSelectedSession(s); setManualKey(String(s.session_key)); }}
          />
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            title="Refresh"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Session mode quick-select tabs */}
      <SessionModeTabs sessions={(sessions2025 ?? []) as OF1Session[]} selected={selectedSession} onSelect={(s) => { setSelectedSession(s); setManualKey(String(s.session_key)); }} />

      {/* Content */}
      {isRaceMode && <RaceTimingTower sessionKey={sessionKey} isLive={isLive} />}
      {isQualMode && <QualifyingView sessionKey={sessionKey} sessionName={sessionName} />}
      {isPractMode && <PracticeView sessionKey={sessionKey} />}
      {!isRaceMode && !isQualMode && !isPractMode && (
        <RaceTimingTower sessionKey={sessionKey} isLive={isLive} />
      )}
    </div>
  );
}

// ─── Session mode tabs (grouped by type for current GP) ───────────────────────
function SessionModeTabs({
  sessions, selected, onSelect,
}: {
  sessions: OF1Session[];
  selected: OF1Session | null;
  onSelect: (s: OF1Session) => void;
}) {
  if (!selected || !sessions.length) return null;

  const same = sessions.filter(s => s.meeting_key === selected.meeting_key);
  if (same.length <= 1) return null;

  const typeOrder: Record<string, number> = {
    Practice: 0, Practice_1: 0, Practice_2: 1, Practice_3: 2,
    Sprint_Qualifying: 3, Sprint: 4,
    Qualifying: 5, Race: 6,
  };

  const sorted = [...same].sort((a, b) => {
    const ao = typeOrder[a.session_type] ?? 9;
    const bo = typeOrder[b.session_type] ?? 9;
    return ao !== bo ? ao - bo : new Date(a.date_start).getTime() - new Date(b.date_start).getTime();
  });

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sorted.map(s => (
        <button
          key={s.session_key}
          onClick={() => onSelect(s)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors border",
            selected.session_key === s.session_key
              ? `${sessionBadgeClass(s.session_type)} border-transparent`
              : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white"
          )}
        >
          {s.session_name}
        </button>
      ))}
    </div>
  );
}

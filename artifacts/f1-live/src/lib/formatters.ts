export function formatGapToLeader(gap: string | number | null | undefined): string {
  if (gap === null || gap === undefined || gap === "") return "";
  if (gap === 0 || gap === "0" || gap === "0.000") return "LEADER";
  if (typeof gap === "string") {
    if (gap.startsWith("+")) return gap;
    return `+${gap}`;
  }
  if (gap < 60) return `+${gap.toFixed(3)}`;
  const laps = Math.floor(gap / 60);
  return `+${laps} LAP${laps > 1 ? "S" : ""}`;
}

export function formatInterval(interval: string | number | null | undefined): string {
  if (interval === null || interval === undefined || interval === "") return "";
  if (typeof interval === "string") {
    if (interval.startsWith("+")) return interval;
    return `+${interval}`;
  }
  if (interval === 0) return "";
  return `+${interval.toFixed(3)}`;
}

export function formatLapTime(ms: number | null | undefined): string {
  if (!ms) return "—";
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(3).padStart(6, "0");
  return m === 0 ? s : `${m}:${s}`;
}

export function formatSectorTime(s: number | null | undefined): string {
  if (!s) return "—";
  if (s < 60) return s.toFixed(3);
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3).padStart(6, "0");
  return `${m}:${sec}`;
}

export function formatOpenF1LapTime(s: number | null | undefined): string {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3).padStart(6, "0");
  return m === 0 ? sec : `${m}:${sec}`;
}

export function formatGapSeconds(gap: number | null | undefined): string {
  if (gap === null || gap === undefined) return "—";
  if (gap === 0) return "LEADER";
  return `+${gap.toFixed(3)}`;
}

export function getTireColor(compound: string | null | undefined) {
  switch (compound?.toUpperCase()) {
    case "SOFT":
    case "soft":
      return "bg-[#E8002D] text-white";
    case "MEDIUM":
    case "medium":
      return "bg-[#FFF200] text-black";
    case "HARD":
    case "hard":
      return "bg-white text-black";
    case "INTERMEDIATE":
    case "intermediate":
      return "bg-[#39B54A] text-white";
    case "WET":
    case "wet":
      return "bg-[#0067FF] text-white";
    default:
      return "bg-zinc-700 text-zinc-300";
  }
}

export function getTireColorHex(compound: string | null | undefined): string {
  switch (compound?.toUpperCase()) {
    case "SOFT": return "#E8002D";
    case "MEDIUM": return "#FFF200";
    case "HARD": return "#FFFFFF";
    case "INTERMEDIATE": return "#39B54A";
    case "WET": return "#0067FF";
    default: return "#555";
  }
}

export function getTireInitial(compound: string | null | undefined): string {
  switch (compound?.toUpperCase()) {
    case "SOFT": return "S";
    case "MEDIUM": return "M";
    case "HARD": return "H";
    case "INTERMEDIATE": return "I";
    case "WET": return "W";
    default: return "?";
  }
}

export function getFlagColor(flag: string | null | undefined): string {
  switch (flag) {
    case "green": return "#22c55e";
    case "yellow": return "#FFF200";
    case "red": return "#E8002D";
    case "chequered": return "#fff";
    case "white": return "#fff";
    default: return "#888";
  }
}

export function getRaceControlBg(category: string | null | undefined, flag: string | null | undefined): string {
  if (flag === "red" || category === "red_flag") return "bg-red-950/60 border-red-500/50 text-red-400";
  if (flag === "yellow" || category === "yellow") return "bg-yellow-950/60 border-yellow-500/50 text-yellow-300";
  if (flag === "green") return "bg-green-950/60 border-green-500/50 text-green-400";
  if (category === "safety_car" || category === "sc") return "bg-orange-950/60 border-orange-500/50 text-orange-300";
  if (category === "vsc") return "bg-amber-950/60 border-amber-500/50 text-amber-300";
  if (category === "drs") return "bg-sky-950/60 border-sky-500/50 text-sky-300";
  return "bg-zinc-900/60 border-zinc-700/50 text-zinc-300";
}

export function sessionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    Practice: "PRACTICE",
    Practice_1: "FP1",
    Practice_2: "FP2",
    Practice_3: "FP3",
    Qualifying: "QUALIFYING",
    Sprint_Qualifying: "SPRINT QUALI",
    Sprint: "SPRINT",
    Race: "RACE",
  };
  return map[type] ?? type.toUpperCase();
}

export function sessionTypeIcon(type: string): string {
  if (type.includes("Sprint_Qualifying")) return "⚡Q";
  if (type.includes("Sprint")) return "⚡";
  if (type.includes("Qualifying")) return "Q";
  if (type.includes("Practice")) return "P";
  return "R";
}

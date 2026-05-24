export function formatGapToLeader(gapMs: number | undefined | null): string {
  if (gapMs === undefined || gapMs === null) return "";
  if (gapMs === 0) return "LEADER";
  if (gapMs < 60000) return `+${(gapMs / 1000).toFixed(3)}`;
  return "+1 LAP";
}

export function formatInterval(intervalMs: number | undefined | null): string {
  if (intervalMs === undefined || intervalMs === null) return "";
  if (intervalMs === 0) return "";
  return `+${(intervalMs / 1000).toFixed(3)}`;
}

export function formatLapTime(ms: number | undefined | null): string {
  if (!ms) return "";
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(3).padStart(6, '0');
  if (m === 0) return s;
  return `${m}:${s}`;
}

export function getTireColor(compound: string | undefined | null) {
  switch (compound?.toLowerCase()) {
    case 'soft': return 'bg-[#E8002D] text-white';
    case 'medium': return 'bg-[#FFF200] text-black';
    case 'hard': return 'bg-[#FFFFFF] text-black';
    case 'intermediate': return 'bg-[#39B54A] text-white';
    case 'wet': return 'bg-[#0067FF] text-white';
    default: return 'bg-muted text-muted-foreground';
  }
}

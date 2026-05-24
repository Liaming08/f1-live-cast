import { Router } from "express";

const router = Router();
const OF1 = "https://api.openf1.org/v1";

// ─── Cache with TTL + never-cache-empty-arrays ────────────────────────────────
const cache = new Map<string, { data: unknown; ts: number }>();

function cacheGet<T>(key: string, ttlMs: number): T | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return hit.data as T;
  return null;
}
function cacheSet(key: string, data: unknown) {
  // Don't cache empty arrays
  if (Array.isArray(data) && data.length === 0) return;
  if (data && typeof data === "object" && (data as Record<string, unknown>)["timing"] !== undefined) {
    const timing = (data as Record<string, unknown>)["timing"] as unknown[];
    if (timing.length === 0) return; // don't cache empty timing bundles
  }
  cache.set(key, { data, ts: Date.now() });
}

// Fetch from OpenF1 with stale-while-revalidate on 429
async function f1fetch(path: string): Promise<unknown[]> {
  try {
    const r = await fetch(`${OF1}${path}`, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (r.status === 429) {
      // Rate limited — return stale or retry once after delay
      const stale = cache.get(`raw:${path}`);
      if (stale) return stale.data as unknown[];
      await new Promise(res => setTimeout(res, 1500));
      const r2 = await fetch(`${OF1}${path}`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!r2.ok) return [];
      const data2 = await r2.json() as unknown[];
      if (data2.length) cache.set(`raw:${path}`, { data: data2, ts: Date.now() });
      return data2;
    }
    if (!r.ok) throw new Error(`OpenF1 ${path} → ${r.status}`);
    const data = await r.json() as unknown[];
    if (data.length) cache.set(`raw:${path}`, { data, ts: Date.now() });
    return data;
  } catch (err) {
    const stale = cache.get(`raw:${path}`);
    if (stale) return stale.data as unknown[];
    return [];
  }
}

function latestPerDriver<T extends { driver_number: number }>(records: T[]): T[] {
  const map = new Map<number, T>();
  for (const r of records) map.set(r.driver_number, r);
  return [...map.values()];
}

function latestStintPerDriver(stints: {
  driver_number: number; stint_number: number; compound: string;
  tyre_age_at_start: number; lap_start: number; lap_end: number | null;
}[]) {
  const map = new Map<number, typeof stints[0]>();
  for (const s of stints) {
    const ex = map.get(s.driver_number);
    if (!ex || s.stint_number > ex.stint_number) map.set(s.driver_number, s);
  }
  return [...map.values()];
}

function bestLapPerDriver(laps: {
  driver_number: number; lap_duration: number | null; lap_number: number;
  duration_sector_1: number | null; duration_sector_2: number | null; duration_sector_3: number | null;
  is_pit_out_lap: boolean;
}[]) {
  const map = new Map<number, typeof laps[0]>();
  for (const l of laps) {
    if (!l.lap_duration || l.is_pit_out_lap) continue;
    const ex = map.get(l.driver_number);
    if (!ex || l.lap_duration < ex.lap_duration!) map.set(l.driver_number, l);
  }
  return [...map.values()];
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get("/openf1/sessions", async (req, res) => {
  const { year = new Date().getFullYear(), session_type, meeting_key } = req.query;
  const ckey = `sessions:${year}:${session_type ?? ""}:${meeting_key ?? ""}`;
  const cached = cacheGet<unknown[]>(ckey, 120_000);
  if (cached) return res.json(cached);
  try {
    let url = `/sessions?year=${year}`;
    if (session_type) url += `&session_type=${session_type}`;
    if (meeting_key) url += `&meeting_key=${meeting_key}`;
    const data = await f1fetch(url);
    cacheSet(ckey, data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

router.get("/openf1/session-info", async (req, res) => {
  const sk = req.query.sessionKey || "latest";
  const ckey = `session-info:${sk}`;
  const cached = cacheGet<unknown>(ckey, 60_000);
  if (cached) return res.json(cached);
  try {
    const sessions = await f1fetch(`/sessions?session_key=${sk}`) as { session_key: number; session_name: string; session_type: string; meeting_key: number; circuit_short_name: string; country_name: string; date_start: string; date_end: string; year: number; location: string }[];
    if (!sessions.length) return res.status(404).json({ error: "Session not found" });
    const info = sessions[sessions.length - 1];
    cacheSet(ckey, info);
    res.json(info);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

router.get("/openf1/live", async (req, res) => {
  const sk = req.query.sessionKey || "latest";
  const ckey = `live:${sk}`;
  const cached = cacheGet<unknown>(ckey, 8_000);
  if (cached) return res.json(cached);

  try {
    const [positions, weather, raceControl, stints, drivers, intervals] = await Promise.allSettled([
      f1fetch(`/position?session_key=${sk}`),
      f1fetch(`/weather?session_key=${sk}`),
      f1fetch(`/race_control?session_key=${sk}`),
      f1fetch(`/stints?session_key=${sk}`),
      f1fetch(`/drivers?session_key=${sk}`),
      f1fetch(`/intervals?session_key=${sk}`),
    ]);

    const pos = positions.status === "fulfilled" ? positions.value : [];
    const wx = weather.status === "fulfilled" ? weather.value : [];
    const rc = raceControl.status === "fulfilled" ? raceControl.value : [];
    const st = stints.status === "fulfilled" ? stints.value : [];
    const drv = drivers.status === "fulfilled" ? drivers.value : [];
    const ivl = intervals.status === "fulfilled" ? intervals.value : [];

    type Pos = { driver_number: number; position: number; date: string };
    type Wx = { air_temperature: number; track_temperature: number; wind_speed: number; wind_direction: number; humidity: number; rainfall: number; pressure: number };
    type RC = { date: string; message: string; category: string; flag: string | null; lap_number: number | null };
    type Stint = { driver_number: number; stint_number: number; compound: string; tyre_age_at_start: number; lap_start: number; lap_end: number | null };
    type Driver = { driver_number: number; name_acronym: string; abbreviation: string; team_name: string; team_colour: string; full_name: string; headshot_url: string | null };
    type Interval = { driver_number: number; gap_to_leader: string | null; interval: string | null };

    const latestPos = latestPerDriver(pos as Pos[]);
    const latestWeather: Wx | null = wx.length ? (wx as Wx[])[wx.length - 1] : null;
    const latestStints = latestStintPerDriver(st as Stint[]);
    const latestIntervals = latestPerDriver(ivl as Interval[]);

    const driverMap = new Map<number, Driver>();
    for (const d of drv as Driver[]) driverMap.set(d.driver_number, d);

    const stintMap = new Map<number, Stint>();
    for (const s of latestStints) stintMap.set(s.driver_number, s);

    const intervalMap = new Map<number, Interval>();
    for (const i of latestIntervals) intervalMap.set(i.driver_number, i);

    const sorted = latestPos.sort((a, b) => a.position - b.position);

    const timing = sorted.map(p => {
      const d = driverMap.get(p.driver_number);
      const stint = stintMap.get(p.driver_number);
      const ivl = intervalMap.get(p.driver_number);
      const tyreAge = stint ? stint.tyre_age_at_start + (stint.lap_end ? stint.lap_end - stint.lap_start + 1 : 0) : null;
      return {
        position: p.position,
        driverNumber: p.driver_number,
        abbreviation: d?.name_acronym ?? d?.abbreviation ?? String(p.driver_number),
        fullName: d?.full_name ?? "",
        teamName: d?.team_name ?? "",
        teamColor: d?.team_colour ? `#${d.team_colour}` : "#666",
        headshotUrl: d?.headshot_url ?? null,
        compound: stint?.compound ?? null,
        tyreAge,
        gapToLeader: ivl?.gap_to_leader ?? null,
        interval: ivl?.interval ?? null,
      };
    });

    const result = {
      sessionKey: sk,
      timing,
      weather: latestWeather,
      raceControl: (rc as RC[]).slice(-15).reverse(),
    };

    cacheSet(ckey, result);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

router.get("/openf1/qualifying", async (req, res) => {
  const sk = req.query.sessionKey || "latest";
  const ckey = `qualifying:${sk}`;
  const cached = cacheGet<unknown>(ckey, 15_000);
  if (cached) return res.json(cached);

  try {
    const [laps, drivers, sessions] = await Promise.allSettled([
      f1fetch(`/laps?session_key=${sk}`),
      f1fetch(`/drivers?session_key=${sk}`),
      f1fetch(`/sessions?session_key=${sk}`),
    ]);

    const lapsData = laps.status === "fulfilled" ? laps.value : [];
    const drvsData = drivers.status === "fulfilled" ? drivers.value : [];
    const sessData = sessions.status === "fulfilled" ? sessions.value : [];

    type Lap = { driver_number: number; lap_duration: number | null; lap_number: number; duration_sector_1: number | null; duration_sector_2: number | null; duration_sector_3: number | null; is_pit_out_lap: boolean };
    type Driver = { driver_number: number; name_acronym: string; abbreviation: string; team_name: string; team_colour: string; full_name: string; headshot_url: string | null };
    type Sess = { session_name: string; session_type: string };

    const sessionInfo = (sessData as Sess[]).at(-1) ?? { session_name: "Qualifying", session_type: "Qualifying" };
    const driverMap = new Map<number, Driver>();
    for (const d of drvsData as Driver[]) driverMap.set(d.driver_number, d);

    const bestLaps = bestLapPerDriver(lapsData as Lap[]);
    const sorted = bestLaps.filter(l => l.lap_duration !== null).sort((a, b) => (a.lap_duration ?? 999) - (b.lap_duration ?? 999));
    const poleLap = sorted[0]?.lap_duration ?? null;

    const results = sorted.map((l, idx) => {
      const d = driverMap.get(l.driver_number);
      return {
        position: idx + 1,
        driverNumber: l.driver_number,
        abbreviation: d?.name_acronym ?? d?.abbreviation ?? String(l.driver_number),
        fullName: d?.full_name ?? "",
        teamName: d?.team_name ?? "",
        teamColor: d?.team_colour ? `#${d.team_colour}` : "#666",
        headshotUrl: d?.headshot_url ?? null,
        lapTime: l.lap_duration,
        lapNumber: l.lap_number,
        gapToPole: poleLap && l.lap_duration ? l.lap_duration - poleLap : null,
        s1: l.duration_sector_1, s2: l.duration_sector_2, s3: l.duration_sector_3,
      };
    });

    const noTime = [...driverMap.values()]
      .filter(d => !sorted.find(l => l.driver_number === d.driver_number))
      .map((d, i) => ({
        position: results.length + i + 1,
        driverNumber: d.driver_number,
        abbreviation: d.name_acronym ?? d.abbreviation,
        fullName: d.full_name ?? "",
        teamName: d.team_name ?? "",
        teamColor: d.team_colour ? `#${d.team_colour}` : "#666",
        headshotUrl: d.headshot_url ?? null,
        lapTime: null, lapNumber: null, gapToPole: null,
        s1: null, s2: null, s3: null,
      }));

    const result = {
      sessionKey: sk,
      sessionName: sessionInfo.session_name,
      sessionType: sessionInfo.session_type,
      results: [...results, ...noTime],
    };
    cacheSet(ckey, result);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

router.get("/openf1/practice", async (req, res) => {
  const sk = req.query.sessionKey || "latest";
  const ckey = `practice:${sk}`;
  const cached = cacheGet<unknown>(ckey, 15_000);
  if (cached) return res.json(cached);

  try {
    const [laps, drivers] = await Promise.allSettled([
      f1fetch(`/laps?session_key=${sk}`),
      f1fetch(`/drivers?session_key=${sk}`),
    ]);

    const lapsData = laps.status === "fulfilled" ? laps.value : [];
    const drvsData = drivers.status === "fulfilled" ? drivers.value : [];

    type Lap = { driver_number: number; lap_duration: number | null; lap_number: number; duration_sector_1: number | null; duration_sector_2: number | null; duration_sector_3: number | null; is_pit_out_lap: boolean };
    type Driver = { driver_number: number; name_acronym: string; abbreviation: string; team_name: string; team_colour: string; full_name: string; headshot_url: string | null };

    const driverMap = new Map<number, Driver>();
    for (const d of drvsData as Driver[]) driverMap.set(d.driver_number, d);

    const lapCounts = new Map<number, number>();
    for (const l of lapsData as Lap[]) lapCounts.set(l.driver_number, (lapCounts.get(l.driver_number) ?? 0) + 1);

    const bestLaps = bestLapPerDriver(lapsData as Lap[]);
    const sorted = bestLaps.filter(l => l.lap_duration !== null).sort((a, b) => (a.lap_duration ?? 999) - (b.lap_duration ?? 999));
    const fastest = sorted[0]?.lap_duration ?? null;

    const result = {
      sessionKey: sk,
      results: sorted.map((l, idx) => {
        const d = driverMap.get(l.driver_number);
        return {
          position: idx + 1,
          driverNumber: l.driver_number,
          abbreviation: d?.name_acronym ?? String(l.driver_number),
          fullName: d?.full_name ?? "",
          teamName: d?.team_name ?? "",
          teamColor: d?.team_colour ? `#${d.team_colour}` : "#666",
          headshotUrl: d?.headshot_url ?? null,
          lapTime: l.lap_duration,
          gap: fastest && l.lap_duration ? l.lap_duration - fastest : null,
          s1: l.duration_sector_1, s2: l.duration_sector_2, s3: l.duration_sector_3,
          lapsCompleted: lapCounts.get(l.driver_number) ?? 0,
        };
      }),
    };
    cacheSet(ckey, result);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

export default router;

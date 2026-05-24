import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { 
  useGetRace, 
  useGetRaceSummary, 
  useListCommentary, 
  useListRaceControl,
  useGetLatestPositions,
  useListTireStrategies,
  getGetRaceQueryKey,
  getListCommentaryQueryKey,
  getListRaceControlQueryKey,
  getGetLatestPositionsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Flag, ShieldAlert, Timer, Zap, Info, Skull } from "lucide-react";
import { formatLapTime, formatGapToLeader, formatInterval, getTireColor } from "@/lib/formatters";

export default function RaceDetail() {
  const { id } = useParams<{ id: string }>();
  const raceId = parseInt(id, 10);
  const queryClient = useQueryClient();

  const { data: race, isLoading: isLoadingRace } = useGetRace(raceId);
  const { data: summary } = useGetRaceSummary(raceId);
  const { data: commentary } = useListCommentary(raceId);
  const { data: raceControl } = useListRaceControl(raceId);
  const { data: positions } = useGetLatestPositions(raceId);
  const { data: tireStrategies } = useListTireStrategies(raceId);

  useEffect(() => {
    // Only auto-refresh if race is active or practice/quali
    if (race?.status === 'finished') return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getGetRaceQueryKey(raceId) });
      queryClient.invalidateQueries({ queryKey: getListCommentaryQueryKey(raceId) });
      queryClient.invalidateQueries({ queryKey: getListRaceControlQueryKey(raceId) });
      queryClient.invalidateQueries({ queryKey: getGetLatestPositionsQueryKey(raceId) });
    }, 5000);
    return () => clearInterval(interval);
  }, [queryClient, raceId, race?.status]);

  if (isLoadingRace) {
    return <div className="space-y-6"><Skeleton className="h-40 w-full bg-card" /></div>;
  }

  if (!race) return <div>Race not found.</div>;

  const getCommentaryIcon = (type: string) => {
    switch (type) {
      case 'safety_car': return <ShieldAlert className="w-4 h-4 text-orange-500" />;
      case 'vsc': return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'flag': return <Flag className="w-4 h-4 text-yellow-500" />;
      case 'incident': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'fastest_lap': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'dnf': return <Skull className="w-4 h-4 text-destructive" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCommentaryColor = (type: string) => {
    switch (type) {
      case 'safety_car': return 'border-orange-500 bg-orange-500/10';
      case 'vsc': return 'border-amber-500 bg-amber-500/10';
      case 'flag': return 'border-yellow-500 bg-yellow-500/10';
      case 'radio': return 'border-blue-500 bg-blue-500/10';
      case 'incident': return 'border-red-500 bg-red-500/10';
      case 'fastest_lap': return 'border-purple-500 bg-purple-500/10';
      case 'overtake': return 'border-cyan-500 bg-cyan-500/10';
      case 'pit_stop': return 'border-slate-500 bg-slate-500/10';
      case 'dnf': return 'border-destructive bg-destructive/10';
      default: return 'border-border bg-card';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-primary font-bold text-sm tracking-wider mb-1 uppercase">Round {race.round}</div>
              <CardTitle className="text-3xl tracking-tighter uppercase">{race.name}</CardTitle>
              <div className="text-muted-foreground font-mono mt-1 text-sm">
                {race.circuit}, {race.country} • {format(new Date(race.raceDate), 'MMM d, yyyy')}
              </div>
            </div>
            <Badge variant="outline" className="uppercase tracking-widest font-bold bg-primary/20 text-primary border-primary">
              {race.status}
            </Badge>
          </div>
        </CardHeader>
        {summary && (
          <CardContent className="bg-secondary/30 pt-4 border-t border-border/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-muted-foreground uppercase mb-1">Fastest Lap</div>
                <div className="font-mono font-bold text-purple-400">
                  {summary.fastestLap || '--'} <span className="text-xs text-muted-foreground">{summary.fastestLapDriver}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase mb-1">Safety Cars</div>
                <div className="font-mono font-bold">{summary.safetyCarPeriods}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase mb-1">DNFs</div>
                <div className="font-mono font-bold text-destructive">{summary.dnfCount}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase mb-1">Laps Completed</div>
                <div className="font-mono font-bold">{summary.totalLapsCompleted || race.currentLap || 0} / {race.totalLaps || '-'}</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border/50">
            <CardHeader className="bg-secondary/30 border-b border-border/50 py-3">
              <CardTitle className="text-sm tracking-widest uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[600px] overflow-y-auto">
              <div className="flex flex-col">
                {commentary?.map((item) => (
                  <div key={item.id} className={`p-4 border-b border-border/50 border-l-4 ${getCommentaryColor(item.type)} transition-colors`}>
                    <div className="flex items-center gap-2 mb-1">
                      {item.lap && <Badge variant="secondary" className="font-mono text-xs rounded-sm">L{item.lap}</Badge>}
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {item.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto font-mono">
                        {format(new Date(item.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="font-medium text-sm lg:text-base leading-snug">
                      {item.driverName && <strong className="uppercase mr-2">{item.driverName}:</strong>}
                      {item.message}
                    </div>
                  </div>
                ))}
                {(!commentary || commentary.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground">No commentary available yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border/50">
            <CardHeader className="bg-secondary/30 border-b border-border/50 py-3">
              <CardTitle className="text-sm tracking-widest uppercase flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" /> Top 10 Positions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs font-mono">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-8 text-center">P</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Gap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions?.slice(0,10).map((pos) => (
                    <TableRow key={pos.driverId} className="hover:bg-white/[0.02]">
                      <TableCell className="text-center font-bold">{pos.position}</TableCell>
                      <TableCell className="font-bold flex items-center gap-2 border-none">
                        <div className="w-1 h-3 rounded-full" style={{ backgroundColor: pos.teamColor || '#666' }} />
                        {pos.driverAbbr}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatGapToLeader(pos.gapToLeaderMs)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {raceControl && raceControl.length > 0 && (
            <Card className="bg-card border-border/50">
              <CardHeader className="bg-secondary/30 border-b border-border/50 py-3">
                <CardTitle className="text-sm tracking-widest uppercase flex items-center gap-2">
                  <Flag className="w-4 h-4 text-yellow-500" /> Race Control
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                 <div className="flex flex-col">
                  {raceControl.map((msg) => (
                    <div key={msg.id} className="p-3 border-b border-border/50 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase">{msg.category}</Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">{format(new Date(msg.timestamp), 'HH:mm')}</span>
                      </div>
                      <div className="font-mono">{msg.message}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Ensure icons used are imported
import { AlertCircle } from "lucide-react";
import { Activity } from "lucide-react";

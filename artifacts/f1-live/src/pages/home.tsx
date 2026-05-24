import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetLiveRace, 
  useGetLatestPositions, 
  getGetLiveRaceQueryKey, 
  getGetLatestPositionsQueryKey,
  useListRaceControl,
  getListRaceControlQueryKey
} from "@workspace/api-client-react";
import { formatGapToLeader, formatInterval, formatLapTime, getTireColor } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle } from "lucide-react";

export default function Home() {
  const queryClient = useQueryClient();
  const { data: liveSummary, isLoading: isLiveLoading } = useGetLiveRace();
  
  const raceId = liveSummary?.race?.id;
  
  const { data: positions, isLoading: isPositionsLoading } = useGetLatestPositions(raceId as number, { 
    query: { enabled: !!raceId, queryKey: getGetLatestPositionsQueryKey(raceId as number) } 
  });

  const { data: raceControl } = useListRaceControl(raceId as number, {
    query: { enabled: !!raceId, queryKey: getListRaceControlQueryKey(raceId as number) }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getGetLiveRaceQueryKey() });
      if (raceId) {
        queryClient.invalidateQueries({ queryKey: getGetLatestPositionsQueryKey(raceId) });
        queryClient.invalidateQueries({ queryKey: getListRaceControlQueryKey(raceId) });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [queryClient, raceId]);

  if (isLiveLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full bg-card" />
        <Skeleton className="h-[600px] w-full bg-card" />
      </div>
    );
  }

  if (!liveSummary?.hasLiveRace || !liveSummary.race) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Activity className="w-16 h-16 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold tracking-tight text-muted-foreground uppercase">No Live Race</h2>
        <p className="text-muted-foreground text-sm">Check the calendar for upcoming sessions.</p>
      </div>
    );
  }

  const race = liveSummary.race;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Race Status Banner */}
      <Card className="border-border/50 bg-card overflow-hidden">
        <div className="flex items-center justify-between p-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary uppercase font-bold tracking-wider">
                {race.status}
              </Badge>
              {race.safetyCarDeployed && (
                 <Badge variant="outline" className="bg-orange-500/20 text-orange-500 border-orange-500 uppercase font-bold flex gap-1">
                   <AlertTriangle className="w-3 h-3" /> Safety Car
                 </Badge>
              )}
              {race.vscDeployed && (
                 <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500 uppercase font-bold flex gap-1">
                   <AlertTriangle className="w-3 h-3" /> VSC
                 </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase">{race.name}</h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              Lap {race.currentLap || 0} / {race.totalLaps || '-'} • {race.circuit}
            </p>
          </div>
          <div className="text-right space-y-1 font-mono text-sm hidden md:block">
            <p><span className="text-muted-foreground">AIR</span> {race.airTemp || '--'}°C</p>
            <p><span className="text-muted-foreground">TRACK</span> {race.trackTemp || '--'}°C</p>
            <p><span className="text-muted-foreground">WEATHER</span> {race.weatherCondition || 'Unknown'}</p>
          </div>
        </div>
        
        {/* Race Control Ticker */}
        {raceControl && raceControl.length > 0 && (
          <div className="bg-secondary/50 border-t border-border px-6 py-2 flex items-center overflow-hidden">
            <span className="text-xs font-bold text-muted-foreground uppercase mr-4 whitespace-nowrap">Race Control</span>
            <div className="text-sm font-mono whitespace-nowrap overflow-hidden text-ellipsis text-white/90">
              {raceControl[0].message}
            </div>
          </div>
        )}
      </Card>

      {/* Live Timing Tower */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="font-mono text-sm whitespace-nowrap">
            <TableHeader className="bg-secondary/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-12 text-center">POS</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>DRIVER</TableHead>
                <TableHead className="text-right">GAP</TableHead>
                <TableHead className="text-right">INT</TableHead>
                <TableHead className="text-center w-24">TYRE</TableHead>
                <TableHead className="text-right">LAST LAP</TableHead>
                <TableHead className="text-center w-16">PITS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPositionsLoading ? (
                 <TableRow>
                   <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                     Loading timing data...
                   </TableCell>
                 </TableRow>
              ) : positions?.map((pos) => (
                <TableRow key={pos.driverId} className="border-border/10 hover:bg-white/[0.02]">
                  <TableCell className="text-center font-bold">{pos.position}</TableCell>
                  <TableCell>
                    <div 
                      className="w-1 h-full min-h-6 rounded-full" 
                      style={{ backgroundColor: pos.teamColor || '#666' }} 
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-bold tracking-tight">{pos.driverAbbr}</span>
                    <span className="text-xs text-muted-foreground ml-2 uppercase hidden sm:inline-block font-sans">{pos.teamName}</span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatGapToLeader(pos.gapToLeaderMs)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatInterval(pos.intervalMs)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`font-bold border-0 ${getTireColor(pos.currentTire)}`}>
                      {pos.currentTire?.[0]?.toUpperCase() || '-'}
                      <span className="opacity-75 ml-1 font-normal text-xs">{pos.tireLaps}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatLapTime(pos.lastLapTimeMs)}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {pos.pitStops}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

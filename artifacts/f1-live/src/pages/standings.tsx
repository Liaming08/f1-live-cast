import { useListDriverStandings, useListConstructorStandings, useGetSeasonSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Standings() {
  const { data: drivers, isLoading: loadingDrivers } = useListDriverStandings();
  const { data: constructors, isLoading: loadingConstructors } = useListConstructorStandings();
  const { data: summary, isLoading: loadingSummary } = useGetSeasonSummary();

  if (loadingDrivers || loadingConstructors || loadingSummary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full bg-card" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-[600px] bg-card" />
          <Skeleton className="h-[600px] bg-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">Championship Standings</h1>
      
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Season</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.season}</div>
              <p className="text-xs text-muted-foreground">
                {summary.racesCompleted} / {summary.racesCompleted + summary.racesRemaining} Races
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Driver Leader</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{summary.leadingDriver}</div>
              <p className="text-xs text-primary font-bold">{summary.leadingDriverPoints} PTS</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Constructor Leader</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{summary.leadingConstructor}</div>
              <p className="text-xs text-primary font-bold">{summary.leadingConstructorPoints} PTS</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overtakes</span>
                  <span className="font-mono font-bold">{summary.totalOvertakes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DNFs</span>
                  <span className="font-mono font-bold">{summary.totalDnfs}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card className="bg-card border-border/50 overflow-hidden">
          <CardHeader className="bg-secondary/30 border-b border-border/50 py-4">
            <CardTitle className="text-lg tracking-tight uppercase">Drivers' Championship</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center">POS</TableHead>
                  <TableHead className="w-1"></TableHead>
                  <TableHead>DRIVER</TableHead>
                  <TableHead className="text-right">PTS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers?.map((driver) => (
                  <TableRow key={driver.driverId} className="hover:bg-white/[0.02]">
                    <TableCell className="text-center font-bold text-muted-foreground">{driver.position}</TableCell>
                    <TableCell className="p-0">
                      <div className="w-1 h-8 rounded-full" style={{ backgroundColor: driver.teamColor || '#666' }} />
                    </TableCell>
                    <TableCell>
                      <div className="font-bold tracking-tight">{driver.driverName}</div>
                      <div className="text-xs text-muted-foreground uppercase">{driver.teamName}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">{driver.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 overflow-hidden">
          <CardHeader className="bg-secondary/30 border-b border-border/50 py-4">
            <CardTitle className="text-lg tracking-tight uppercase">Constructors' Championship</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center">POS</TableHead>
                  <TableHead className="w-1"></TableHead>
                  <TableHead>TEAM</TableHead>
                  <TableHead className="text-right">PTS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constructors?.map((team) => (
                  <TableRow key={team.teamId} className="hover:bg-white/[0.02]">
                    <TableCell className="text-center font-bold text-muted-foreground">{team.position}</TableCell>
                    <TableCell className="p-0">
                      <div className="w-1 h-8 rounded-full" style={{ backgroundColor: team.teamColor || '#666' }} />
                    </TableCell>
                    <TableCell className="font-bold tracking-tight uppercase">{team.teamName}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">{team.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

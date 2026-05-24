import { Link } from "wouter";
import { useListRaces } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function Races() {
  const { data: races, isLoading } = useListRaces();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tighter uppercase mb-6">Race Calendar</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">Race Calendar</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {races?.map(race => (
          <Link key={race.id} href={`/races/${race.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer bg-card h-full flex flex-col group">
              <CardHeader className="pb-3 border-b border-border/50 bg-secondary/20">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-primary mb-1 block">ROUND {race.round}</span>
                    <CardTitle className="text-xl uppercase tracking-tight group-hover:text-primary transition-colors">
                      {race.name}
                    </CardTitle>
                  </div>
                  <Badge variant={
                    (race.status as string) === 'live' || race.status === 'race' ? 'default' : 
                    race.status === 'finished' ? 'secondary' : 'outline'
                  } className="uppercase font-bold tracking-wider">
                    {race.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    <span>{race.circuit}, {race.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-mono">
                    <CalendarIcon className="w-4 h-4 text-primary/70" />
                    <span>{format(new Date(race.raceDate), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

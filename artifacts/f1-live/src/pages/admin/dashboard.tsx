import { useListRaces, useListDrivers, useListTeams } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Calendar, Users, Flag, ShieldAlert, ChevronRight } from "lucide-react";

export default function AdminDashboard() {
  const { data: races } = useListRaces();
  const { data: drivers } = useListDrivers();
  const { data: teams } = useListTeams();

  const activeRace = races?.find(r => r.status === 'race' || r.status === 'qualifying' || r.status === 'practice');

  const links = [
    { href: "/admin/races", title: "Manage Races", description: "Create, edit, or delete events", icon: Calendar },
    { href: "/admin/teams", title: "Manage Teams", description: "Constructor details and colors", icon: ShieldAlert },
    { href: "/admin/drivers", title: "Manage Drivers", description: "Driver lineup and team assignments", icon: Users },
    { href: "/admin/commentary", title: "Live Commentary", description: "Post play-by-play updates", icon: Type },
    { href: "/admin/race-control", title: "Race Control", description: "Issue flags and official notices", icon: Flag },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <h1 className="text-2xl font-bold tracking-widest uppercase">System Overview</h1>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-card border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Active Session</CardTitle>
          </CardHeader>
          <CardContent>
            {activeRace ? (
              <>
                <div className="text-lg font-bold uppercase truncate">{activeRace.name}</div>
                <div className="text-xs text-primary font-bold tracking-widest uppercase mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
                  {activeRace.status}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-sm uppercase">No Active Session</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Races</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold">{races?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold">{teams?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-mono font-bold">{drivers?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {links.map(link => (
          <Link key={link.href} href={link.href}>
            <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 bg-secondary rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <link.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold tracking-wider uppercase mb-1 flex items-center justify-between">
                    {link.title}
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-xs text-muted-foreground">{link.description}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { Type } from "lucide-react";

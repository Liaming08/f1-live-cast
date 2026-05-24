import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListRaces, useAddCommentary, getListCommentaryQueryKey, Race } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Type, Send } from "lucide-react";

export default function AdminCommentary() {
  const { data: races } = useListRaces();
  const [activeRaceId, setActiveRaceId] = useState<number | "">("");
  const addCommentary = useAddCommentary();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [message, setMessage] = useState("");
  const [type, setType] = useState<any>("normal");
  const [lap, setLap] = useState("");
  const [driver, setDriver] = useState("");

  const activeRaces = races?.filter(r => r.status === 'race' || r.status === 'qualifying' || r.status === 'practice') || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRaceId || !message) return;

    addCommentary.mutate(
      { 
        id: activeRaceId as number, 
        data: { 
          message, 
          type, 
          lap: lap ? parseInt(lap, 10) : null,
          driverName: driver || null
        } 
      },
      {
        onSuccess: () => {
          toast({ title: "Commentary posted" });
          setMessage("");
          setDriver("");
          // Don't reset lap as it often stays same for multiple events
          queryClient.invalidateQueries({ queryKey: getListCommentaryQueryKey(activeRaceId as number) });
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-3xl">
      <h1 className="text-2xl font-bold tracking-widest uppercase">Live Commentary Desk</h1>

      <Card className="bg-card border-border/50">
        <CardHeader className="bg-secondary/30 border-b border-border/50">
          <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" /> Post Update
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Session</label>
                <Select value={activeRaceId.toString()} onValueChange={(v) => setActiveRaceId(parseInt(v, 10))}>
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue placeholder="Select active race" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRaces.length === 0 && <SelectItem value="none" disabled>No active sessions</SelectItem>}
                    {activeRaces.map(r => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        {r.name} ({r.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Event Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-input border-border/50 font-bold uppercase tracking-wider text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="overtake">Overtake</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="fastest_lap">Fastest Lap</SelectItem>
                    <SelectItem value="pit_stop">Pit Stop</SelectItem>
                    <SelectItem value="radio">Team Radio</SelectItem>
                    <SelectItem value="flag">Flag</SelectItem>
                    <SelectItem value="safety_car">Safety Car</SelectItem>
                    <SelectItem value="vsc">VSC</SelectItem>
                    <SelectItem value="dnf">DNF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
               <div className="space-y-2 col-span-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lap (Opt)</label>
                <Input type="number" value={lap} onChange={(e) => setLap(e.target.value)} className="bg-input border-border/50 font-mono" placeholder="42" />
              </div>
              <div className="space-y-2 col-span-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Driver (Opt)</label>
                <Input value={driver} onChange={(e) => setDriver(e.target.value)} className="bg-input border-border/50 font-bold uppercase" placeholder="VER" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message</label>
              <textarea 
                className="w-full min-h-[100px] bg-input border border-border/50 rounded-md p-3 text-sm resize-none focus:outline-none focus:border-primary transition-colors"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter commentary play-by-play..."
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full font-bold uppercase tracking-widest gap-2" 
              disabled={!activeRaceId || !message || addCommentary.isPending}
            >
              {addCommentary.isPending ? "Posting..." : <><Send className="w-4 h-4" /> Send Update</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

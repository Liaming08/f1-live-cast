import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListRaces, useUpdateRace, useCreateRace, useDeleteRace, getListRacesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus } from "lucide-react";

export default function AdminRaces() {
  const { data: races } = useListRaces();
  const updateRace = useUpdateRace();
  const createRace = useCreateRace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isNewRaceOpen, setIsNewRaceOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    circuit: "",
    country: "",
    round: 1,
    season: new Date().getFullYear(),
    raceDate: format(new Date(), "yyyy-MM-dd"),
    totalLaps: 50,
  });

  const updateFnRef = useRef(updateRace.mutate);
  updateFnRef.current = updateRace.mutate;

  const handleStatusChange = (id: number, status: any) => {
    updateFnRef.current(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "Status updated" });
          queryClient.invalidateQueries({ queryKey: getListRacesQueryKey() });
        },
      }
    );
  };

  const handleToggle = (id: number, field: "safetyCarDeployed" | "vscDeployed", checked: boolean) => {
    updateFnRef.current(
      { id, data: { [field]: checked } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRacesQueryKey() });
        },
      }
    );
  };

  const handleCreateRace = () => {
    if (!formData.name || !formData.circuit || !formData.country) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    createRace.mutate(formData as any, {
      onSuccess: () => {
        toast({ title: "Race created" });
        queryClient.invalidateQueries({ queryKey: getListRacesQueryKey() });
        setIsNewRaceOpen(false);
        setFormData({
          name: "",
          circuit: "",
          country: "",
          round: 1,
          season: new Date().getFullYear(),
          raceDate: format(new Date(), "yyyy-MM-dd"),
          totalLaps: 50,
        });
      },
      onError: () => {
        toast({ title: "Failed to create race", variant: "destructive" });
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Manage Races</h1>
        <Button onClick={() => setIsNewRaceOpen(true)} variant="default" size="sm" className="font-bold tracking-widest uppercase">
          <Plus className="w-4 h-4 mr-2" />
          New Race
        </Button>
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="hover:bg-transparent">
                <TableHead>Round</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SC/VSC</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {races?.map(race => (
                <TableRow key={race.id}>
                  <TableCell className="font-mono text-muted-foreground">{race.round}</TableCell>
                  <TableCell>
                    <div className="font-bold uppercase tracking-tight">{race.name}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(race.raceDate), 'MMM d, yyyy')}</div>
                  </TableCell>
                  <TableCell>
                    <Select value={race.status} onValueChange={(v) => handleStatusChange(race.id, v)}>
                      <SelectTrigger className="h-8 w-32 text-xs font-bold uppercase tracking-wider border-border/50 bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="practice">Practice</SelectItem>
                        <SelectItem value="qualifying">Qualifying</SelectItem>
                        <SelectItem value="race">Race</SelectItem>
                        <SelectItem value="finished">Finished</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={race.safetyCarDeployed} 
                          onCheckedChange={(c) => handleToggle(race.id, 'safetyCarDeployed', c)}
                          disabled={race.status !== 'race' && race.status !== 'qualifying' && race.status !== 'practice'}
                          className="data-[state=checked]:bg-orange-500"
                        />
                        <Label className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">SC</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={race.vscDeployed} 
                          onCheckedChange={(c) => handleToggle(race.id, 'vscDeployed', c)}
                          disabled={race.status !== 'race' && race.status !== 'qualifying' && race.status !== 'practice'}
                          className="data-[state=checked]:bg-amber-500"
                        />
                        <Label className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">VSC</Label>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold uppercase">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isNewRaceOpen} onOpenChange={setIsNewRaceOpen}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">New Race</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase">Race Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Monaco Grand Prix"
                className="bg-input border-border/50"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase">Circuit *</Label>
              <Input
                value={formData.circuit}
                onChange={(e) => setFormData({ ...formData, circuit: e.target.value })}
                placeholder="e.g., Circuit de Monaco"
                className="bg-input border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase">Country *</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="e.g., Monaco"
                  className="bg-input border-border/50"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Round</Label>
                <Input
                  type="number"
                  value={formData.round}
                  onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) })}
                  min={1}
                  className="bg-input border-border/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase">Season</Label>
                <Input
                  type="number"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: parseInt(e.target.value) })}
                  min={2000}
                  className="bg-input border-border/50"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Race Date</Label>
                <Input
                  type="date"
                  value={formData.raceDate}
                  onChange={(e) => setFormData({ ...formData, raceDate: e.target.value })}
                  className="bg-input border-border/50"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase">Total Laps</Label>
              <Input
                type="number"
                value={formData.totalLaps}
                onChange={(e) => setFormData({ ...formData, totalLaps: parseInt(e.target.value) })}
                min={1}
                className="bg-input border-border/50"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsNewRaceOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateRace} className="font-bold uppercase">Create Race</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

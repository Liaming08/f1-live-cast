import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListRaces, useListRaceControl, useAddRaceControl, getListRaceControlQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Flag } from "lucide-react";
import { format } from "date-fns";

export default function AdminRaceControl() {
  const { data: races = [] } = useListRaces();
  const [selectedRaceId, setSelectedRaceId] = useState<string>("");
  const { data: raceControl = [] } = useListRaceControl(selectedRaceId ? parseInt(selectedRaceId) : 0);
  
  const addRaceControl = useAddRaceControl();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ message: "", category: "flag", flag: "", lap: 0 });

  const addFnRef = useRef(addRaceControl.mutate);
  addFnRef.current = addRaceControl.mutate;

  const handleCreate = () => {
    if (!formData.message || !formData.category) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    if (!selectedRaceId) {
      toast({ title: "Please select a race", variant: "destructive" });
      return;
    }

    addFnRef.current(
      {
        id: parseInt(selectedRaceId),
        data: {
          message: formData.message,
          category: formData.category as any,
          flag: (formData.flag || undefined) as any,
          lap: formData.lap > 0 ? formData.lap : undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Race control message added" });
          queryClient.invalidateQueries({ queryKey: getListRaceControlQueryKey(parseInt(selectedRaceId)) });
          setFormData({ message: "", category: "flag", flag: "", lap: 0 });
          setIsOpen(false);
        },
        onError: () => {
          toast({ title: "Failed to add message", variant: "destructive" });
        },
      }
    );
  };

  const selectedRace = races.find(r => r.id === parseInt(selectedRaceId || "0"));

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Race Control</h1>
        <Button onClick={() => setIsOpen(true)} variant="default" size="sm" className="font-bold tracking-widest uppercase">
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </Button>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <Label className="text-xs font-bold uppercase mb-2">Select Race</Label>
          <Select value={selectedRaceId} onValueChange={setSelectedRaceId}>
            <SelectTrigger id="race-select" className="bg-input border-border/50">
              <SelectValue placeholder="Choose a race..." />
            </SelectTrigger>
            <SelectContent>
              {races?.map(race => (
                <SelectItem key={race.id} value={race.id.toString()}>
                  Round {race.round} - {race.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {selectedRaceId && (
        <>
          <Card className="bg-card border-border/50">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold uppercase mb-4">{selectedRace?.name} - Race Control Log</h3>
              <div className="space-y-3">
                {raceControl && raceControl.length > 0 ? (
                  raceControl.map((entry: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-3 bg-secondary/30 rounded border border-border/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs uppercase">
                            {entry.category}
                          </Badge>
                          {entry.flag && (
                            <Badge variant="secondary" className="text-xs">
                              <Flag className="w-3 h-3 mr-1" />
                              {entry.flag}
                            </Badge>
                          )}
                        </div>
                        <p className="font-bold text-sm">{entry.message}</p>
                        {entry.lap && (
                          <p className="text-xs text-muted-foreground">Lap {entry.lap}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(entry.timestamp), "HH:mm:ss")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">No race control messages</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">Add Race Control Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase">Message *</Label>
              <Input
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="e.g., Safety Car deployed"
                className="bg-input border-border/50"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase">Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-input border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flag">Flag</SelectItem>
                  <SelectItem value="vsc">VSC</SelectItem>
                  <SelectItem value="sc">Safety Car</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="penalty">Penalty</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase">Flag (Optional)</Label>
                <Select value={formData.flag} onValueChange={(v) => setFormData({ ...formData, flag: v })}>
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="checkered">Checkered</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Lap (Optional)</Label>
                <Input
                  type="number"
                  value={formData.lap}
                  onChange={(e) => setFormData({ ...formData, lap: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="bg-input border-border/50"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="font-bold uppercase">Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

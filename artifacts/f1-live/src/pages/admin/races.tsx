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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AdminRaces() {
  const { data: races } = useListRaces();
  const updateRace = useUpdateRace();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const updateFnRef = useRef(updateRace.mutate);
  updateFnRef.current = updateRace.mutate;

  const handleStatusChange = (id: number, status: any) => {
    updateFnRef.current(
      { id, data: { status } },
      { 
        onSuccess: () => {
          toast({ title: "Status updated" });
          queryClient.invalidateQueries({ queryKey: getListRacesQueryKey() });
        }
      }
    );
  };

  const handleToggle = (id: number, field: 'safetyCarDeployed' | 'vscDeployed', checked: boolean) => {
    updateFnRef.current(
      { id, data: { [field]: checked } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRacesQueryKey() });
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Manage Races</h1>
        <Button variant="default" size="sm" className="font-bold tracking-widest uppercase">New Race</Button>
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
    </div>
  );
}

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListDrivers, useUpdateDriver, useCreateDriver, useDeleteDriver, getListDriversQueryKey, useListTeams } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Edit2 } from "lucide-react";

export default function AdminDrivers() {
  const { data: drivers } = useListDrivers();
  const { data: teams } = useListTeams();
  const updateDriver = useUpdateDriver();
  const createDriver = useCreateDriver();
  const deleteDriver = useDeleteDriver();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", abbreviation: "", number: 0, nationality: "", teamId: 0 });

  const updateFnRef = useRef(updateDriver.mutate);
  updateFnRef.current = updateDriver.mutate;

  const deleteFnRef = useRef(deleteDriver.mutate);
  deleteFnRef.current = deleteDriver.mutate;

  const handleEdit = (driver: any) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      abbreviation: driver.abbreviation,
      number: driver.number,
      nationality: driver.nationality,
      teamId: driver.teamId || 0,
    });
    setIsOpen(true);
  };

  const handleNewDriver = () => {
    setEditingDriver(null);
    setFormData({ name: "", abbreviation: "", number: 0, nationality: "", teamId: 0 });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.abbreviation || !formData.number || !formData.nationality) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (editingDriver) {
      updateFnRef.current(
        { id: editingDriver.id, data: formData },
        {
          onSuccess: () => {
            toast({ title: "Driver updated" });
            queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
            setIsOpen(false);
          },
          onError: () => {
            toast({ title: "Failed to update driver", variant: "destructive" });
          },
        }
      );
    } else {
      createDriver.mutate(formData as any, {
        onSuccess: () => {
          toast({ title: "Driver created" });
          queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
          setIsOpen(false);
        },
        onError: () => {
          toast({ title: "Failed to create driver", variant: "destructive" });
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure?")) {
      deleteFnRef.current(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Driver deleted" });
            queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });
          },
          onError: () => {
            toast({ title: "Failed to delete driver", variant: "destructive" });
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Manage Drivers</h1>
        <Button onClick={handleNewDriver} variant="default" size="sm" className="font-bold tracking-widest uppercase">
          <Plus className="w-4 h-4 mr-2" />
          New Driver
        </Button>
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Abbr</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers?.map(driver => (
                <TableRow key={driver.id} className="hover:bg-secondary/20">
                  <TableCell className="font-bold text-primary">{driver.number}</TableCell>
                  <TableCell className="font-bold uppercase">{driver.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{driver.abbreviation}</TableCell>
                  <TableCell className="text-xs text-muted-foreground uppercase">{driver.nationality}</TableCell>
                  <TableCell>
                    {driver.teamName ? (
                      <Badge variant="outline" style={{ borderColor: (driver.teamColor as string | undefined) || '#999' }}>
                        {driver.teamName}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">-</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      onClick={() => handleEdit(driver)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(driver.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="tracking-widest uppercase">
              {editingDriver ? "Edit Driver" : "New Driver"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase">Abbreviation *</Label>
                <Input
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value.toUpperCase() })}
                  maxLength={3}
                  className="bg-input border-border/50"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Number *</Label>
                <Input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                  className="bg-input border-border/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase">Nationality *</Label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="bg-input border-border/50"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Team</Label>
                <Select value={formData.teamId.toString()} onValueChange={(v) => setFormData({ ...formData, teamId: parseInt(v) })}>
                  <SelectTrigger className="bg-input border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    {teams?.map(team => (
                      <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="font-bold uppercase">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

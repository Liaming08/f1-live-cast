import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListTeams, useUpdateTeam, useCreateTeam, useDeleteTeam, getListTeamsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Edit2 } from "lucide-react";

export default function AdminTeams() {
  const { data: teams } = useListTeams();
  const updateTeam = useUpdateTeam();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", color: "#FF0000", nationality: "", principal: "", chassis: "", powerUnit: "" });

  const updateFnRef = useRef(updateTeam.mutate);
  updateFnRef.current = updateTeam.mutate;

  const deleteFnRef = useRef(deleteTeam.mutate);
  deleteFnRef.current = deleteTeam.mutate;

  const handleEdit = (team: any) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      color: team.color,
      nationality: team.nationality,
      principal: team.principal,
      chassis: team.chassis || "",
      powerUnit: team.powerUnit || "",
    });
    setIsOpen(true);
  };

  const handleNewTeam = () => {
    setEditingTeam(null);
    setFormData({ name: "", color: "#FF0000", nationality: "", principal: "", chassis: "", powerUnit: "" });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.color || !formData.nationality || !formData.principal) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (editingTeam) {
      updateFnRef.current(
        { id: editingTeam.id, data: formData },
        {
          onSuccess: () => {
            toast({ title: "Team updated" });
            queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
            setIsOpen(false);
          },
          onError: () => {
            toast({ title: "Failed to update team", variant: "destructive" });
          },
        }
      );
    } else {
      createTeam.mutate(formData as any, {
        onSuccess: () => {
          toast({ title: "Team created" });
          queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
          setIsOpen(false);
        },
        onError: () => {
          toast({ title: "Failed to create team", variant: "destructive" });
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
            toast({ title: "Team deleted" });
            queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });
          },
          onError: () => {
            toast({ title: "Failed to delete team", variant: "destructive" });
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-widest uppercase">Manage Teams</h1>
        <Button onClick={handleNewTeam} variant="default" size="sm" className="font-bold tracking-widest uppercase">
          <Plus className="w-4 h-4 mr-2" />
          New Team
        </Button>
      </div>

      <Card className="bg-card border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="hover:bg-transparent">
                <TableHead>Team</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Chassis</TableHead>
                <TableHead>Power Unit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams?.map(team => (
                <TableRow key={team.id} className="hover:bg-secondary/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="font-bold uppercase">{team.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{team.principal}</TableCell>
                  <TableCell className="text-xs text-muted-foreground uppercase">{team.nationality}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{team.chassis || "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{team.powerUnit || "-"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      onClick={() => handleEdit(team)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(team.id)}
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
              {editingTeam ? "Edit Team" : "New Team"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase">Team Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase">Color *</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 rounded border border-border/50 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="bg-input border-border/50 flex-1 font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Nationality *</Label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="bg-input border-border/50"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase">Principal *</Label>
              <Input
                value={formData.principal}
                onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                className="bg-input border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase">Chassis</Label>
                <Input
                  value={formData.chassis}
                  onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
                  className="bg-input border-border/50"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Power Unit</Label>
                <Input
                  value={formData.powerUnit}
                  onChange={(e) => setFormData({ ...formData, powerUnit: e.target.value })}
                  className="bg-input border-border/50"
                />
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

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { service } from "@/services/service";
import { Loader2, Trash2, Pencil } from "lucide-react";

const ENTITY_TYPES = {
  vendor: "Vendor",
  client: "Client",
};

export function EntityManagementDialog({ open, setOpen, entityType, onClose }) {
  if (!ENTITY_TYPES[entityType]) {
    throw new Error("Invalid entity type");
  }

  const title = `Manage ${ENTITY_TYPES[entityType]} List`;
  const description = `Create, update or delete ${ENTITY_TYPES[entityType]}s.`;

  const [entities, setEntities] = useState([]);
  const [newEntityName, setNewEntityName] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntityName, setEditedEntityName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchEntities();
    }
  }, [open, entityType]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const response = await service.getEntities(entityType);
      if (response.data.success) {
        setEntities(response.data.entities);
      } else {
        toast({ title: "Error", description: "Failed to fetch entities", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error fetching entities", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntity = async () => {
    if (!newEntityName.trim()) return;
    setLoading(true);
    try {
      const response = await service.addEntity(entityType, { name: newEntityName });
      if (response.status === 200) {
        fetchEntities();
        setNewEntityName("");
      } else {
        toast({ title: "Error", description: "Failed to add entity", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error adding entity", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEntity = async () => {
    if (!selectedEntityId || !editedEntityName.trim()) return;
    setLoading(true);
    try {
      const response = await service.updateEntity(entityType, selectedEntityId, { name: editedEntityName });
      if (response.status === 200) {
        fetchEntities();
        setIsEditing(false);
        setSelectedEntityId(null);
        setEditedEntityName("");
      } else {
        toast({ title: "Error", description: "Failed to update entity", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error updating entity", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntity = async (id) => {
    setLoading(true);
    try {
      const response = await service.removeEntityById(entityType, id);
      if (response.status === 200) {
        fetchEntities();
      } else {
        toast({ title: "Error", description: "Failed to delete entity", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error deleting entity", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder={`New ${ENTITY_TYPES[entityType]} name`}
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
            />
            <Button variant="outline" size="sm" onClick={handleAddEntity} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
          </div>

          <Label className="text-lg font-medium">Existing {ENTITY_TYPES[entityType]}s:</Label>
          <ScrollArea className="h-[250px] w-full rounded-md border p-2 bg-gray-50">
            {entities.map((entity) => (
                <div
                key={entity.id}
                className="flex items-center justify-between p-3 rounded-lg mb-2 bg-white shadow-sm hover:bg-gray-100 transition"
              >
                <div className="grid">
                <span className="text-[8px] text-black bg-gray-200 px-2 py-1 rounded-sm">{entity.id}</span>
                  <span className="text-sm font-medium mt-2">{entity.name}</span>
                  
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedEntityId(entity.id);
                      setEditedEntityName(entity.name);
                      setIsEditing(true);
                  }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteEntity(entity.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>

          {isEditing && (
            <div className="space-y-2">
              <Label>Edit Name:</Label>
              <Input value={editedEntityName} onChange={(e) => setEditedEntityName(e.target.value)} />
              <Button variant="outline" onClick={handleUpdateEntity} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Update ${ENTITY_TYPES[entityType]}`}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

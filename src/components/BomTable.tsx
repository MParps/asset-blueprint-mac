import { useState, useEffect } from "react";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BomItem {
  id: string;
  item_no: string | null;
  description: string | null;
  details: string | null;
  manufacturer: string | null;
  part_number: string | null;
  item_code: string | null;
  uom: string | null;
  sys_qty: number | null;
  cost: number | null;
}

interface BomTableProps {
  assetId: string | null;
  assetName: string;
}

export const BomTable = ({ assetId, assetName }: BomTableProps) => {
  const [items, setItems] = useState<BomItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedItem, setEditedItem] = useState<Partial<BomItem>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (assetId) {
      loadBomItems();
    }
  }, [assetId]);

  const loadBomItems = async () => {
    if (!assetId) return;

    const { data, error } = await supabase
      .from("bom_items")
      .select("*")
      .eq("asset_id", assetId)
      .order("item_no");

    if (error) {
      console.error("Error loading BOM items:", error);
      return;
    }

    setItems(data || []);
  };

  const startEdit = (item: BomItem) => {
    setEditingId(item.id);
    setEditedItem(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedItem({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("bom_items")
      .update(editedItem)
      .eq("id", editingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Item updated successfully",
    });

    setEditingId(null);
    setEditedItem({});
    loadBomItems();
  };

  const handleFieldChange = (field: keyof BomItem, value: string) => {
    setEditedItem((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!assetId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select an asset to view its BOM</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No BOM items found for this asset</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">{assetName}</h2>
        <p className="text-sm text-muted-foreground">{items.length} items</p>
      </div>
      <div className="flex-1 overflow-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Actions</TableHead>
              <TableHead>Item No.</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Part Number</TableHead>
              <TableHead>Item Code</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Sys Qty</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={saveEdit}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editedItem.item_no || ""}
                        onChange={(e) => handleFieldChange("item_no", e.target.value)}
                        className="w-20"
                      />
                    ) : (
                      item.item_no
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editedItem.description || ""}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                      />
                    ) : (
                      item.description
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editedItem.details || ""}
                        onChange={(e) => handleFieldChange("details", e.target.value)}
                      />
                    ) : (
                      item.details
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editedItem.manufacturer || ""}
                        onChange={(e) => handleFieldChange("manufacturer", e.target.value)}
                      />
                    ) : (
                      item.manufacturer
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editedItem.part_number || ""}
                        onChange={(e) => handleFieldChange("part_number", e.target.value)}
                      />
                    ) : (
                      item.part_number
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editedItem.item_code || ""}
                        onChange={(e) => handleFieldChange("item_code", e.target.value)}
                      />
                    ) : (
                      item.item_code
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editedItem.uom || ""}
                        onChange={(e) => handleFieldChange("uom", e.target.value)}
                        className="w-20"
                      />
                    ) : (
                      item.uom
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedItem.sys_qty || ""}
                        onChange={(e) => handleFieldChange("sys_qty", e.target.value)}
                        className="w-24"
                      />
                    ) : (
                      item.sys_qty
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedItem.cost || ""}
                        onChange={(e) => handleFieldChange("cost", e.target.value)}
                        className="w-24"
                      />
                    ) : (
                      item.cost
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

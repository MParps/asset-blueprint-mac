import { useState, useEffect } from "react";
import { Pencil, Save, X, ChevronRight, FileText } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface AssetMetadata {
  assembly_name: string | null;
  assembly_manufacturer: string | null;
  description: string | null;
  system: string | null;
  rebuild_item: string | null;
  asset_number: string | null;
  approval_date: string | null;
  total_cost: number | null;
}

interface Sheet {
  id: string;
  sheet_name: string;
  sheet_index: number;
}

interface BomTableProps {
  assetId: string | null;
  assetName: string;
  assetPath: string;
}

export const BomTable = ({ assetId, assetName, assetPath }: BomTableProps) => {
  const [items, setItems] = useState<BomItem[]>([]);
  const [metadata, setMetadata] = useState<AssetMetadata | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedItem, setEditedItem] = useState<Partial<BomItem>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (assetId) {
      loadAssetData();
    }
  }, [assetId]);

  useEffect(() => {
    if (currentSheetId) {
      loadBomItems();
    }
  }, [currentSheetId]);

  const loadAssetData = async () => {
    if (!assetId) return;

    // Load metadata
    const { data: assetData } = await supabase
      .from("asset_hierarchy")
      .select("assembly_name, assembly_manufacturer, description, system, rebuild_item, asset_number, approval_date, total_cost")
      .eq("id", assetId)
      .single();

    setMetadata(assetData);

    // Load sheets
    const { data: sheetsData } = await supabase
      .from("asset_sheets")
      .select("*")
      .eq("asset_id", assetId)
      .order("sheet_index");

    if (sheetsData && sheetsData.length > 0) {
      setSheets(sheetsData);
      setCurrentSheetId(sheetsData[0].id);
    }
  };

  const loadBomItems = async () => {
    if (!currentSheetId) return;

    const { data, error } = await supabase
      .from("bom_items")
      .select("*")
      .eq("sheet_id", currentSheetId)
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

  const pathParts = assetPath.split("/");
  const currentSheet = sheets.find(s => s.id === currentSheetId);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-muted/30 p-6 mb-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          {pathParts.map((part, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
              <span>{part}</span>
            </div>
          ))}
        </div>
        <h2 className="text-3xl font-bold">{assetName}</h2>
        {currentSheet && (
          <p className="text-sm text-muted-foreground mt-1">
            Sheet: {currentSheet.sheet_name} • {items.length} items
          </p>
        )}
      </div>
      
      <div className="flex-1 overflow-auto px-6 pb-6">
        {metadata && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Asset Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metadata.assembly_name && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assembly Name</p>
                    <p className="text-sm mt-1">{metadata.assembly_name}</p>
                  </div>
                )}
                {metadata.assembly_manufacturer && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Manufacturer</p>
                    <p className="text-sm mt-1">{metadata.assembly_manufacturer}</p>
                  </div>
                )}
                {metadata.system && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">System</p>
                    <p className="text-sm mt-1">{metadata.system}</p>
                  </div>
                )}
                {metadata.asset_number && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Asset Number</p>
                    <p className="text-sm mt-1">{metadata.asset_number}</p>
                  </div>
                )}
                {metadata.description && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{metadata.description}</p>
                  </div>
                )}
                {metadata.rebuild_item && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rebuild Item</p>
                    <p className="text-sm mt-1">{metadata.rebuild_item}</p>
                  </div>
                )}
                {metadata.approval_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approval Date</p>
                    <p className="text-sm mt-1">{metadata.approval_date}</p>
                  </div>
                )}
                {metadata.total_cost && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                    <p className="text-sm mt-1">${metadata.total_cost.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No BOM items found for this sheet</p>
          </div>
        ) : (
          <div className="border rounded-lg">
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
        )}
      </div>

      {sheets.length > 1 && (
        <div className="fixed bottom-6 right-6 bg-background border rounded-lg shadow-lg p-2 flex gap-1 max-w-md overflow-x-auto">
          {sheets.map((sheet) => (
            <Button
              key={sheet.id}
              variant={currentSheetId === sheet.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentSheetId(sheet.id)}
              className="whitespace-nowrap"
            >
              <FileText className="h-4 w-4 mr-2" />
              {sheet.sheet_name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

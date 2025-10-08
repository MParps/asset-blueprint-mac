import { useState, useEffect } from "react";
import { Pencil, Save, X, ChevronRight, FileText, Image, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [editingField, setEditingField] = useState<{ itemId: string; field: keyof BomItem; value: string; rect: DOMRect } | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
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

    // Load metadata and storage path
    const { data: assetData } = await supabase
      .from("asset_hierarchy")
      .select("assembly_name, assembly_manufacturer, description, system, rebuild_item, asset_number, approval_date, total_cost, storage_path")
      .eq("id", assetId)
      .single();

    setMetadata(assetData);
    setStoragePath(assetData?.storage_path || null);

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
    setEditingField(null);
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

    // Update the local state instead of reloading
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === editingId ? { ...item, ...editedItem } : item
      )
    );

    setEditingId(null);
    setEditedItem({});
    setEditingField(null);
  };

  const handleFieldChange = (field: keyof BomItem, value: string) => {
    setEditedItem((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDownload = async () => {
    if (!storagePath) {
      toast({
        title: "Error",
        description: "Original file not available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('excel-files')
        .download(storagePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = assetName + '.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {pathParts.map((part, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
                <span>{part}</span>
              </div>
            ))}
          </div>
          {storagePath && (
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Original File
            </Button>
          )}
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
          <Card className="mb-6" style={{ backgroundColor: '#0077b6' }}>
            <CardHeader>
              <CardTitle className="text-lg text-white">Asset Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-white/80">Assembly Name</p>
                  <p className="text-sm mt-1 text-white">{metadata.assembly_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Manufacturer</p>
                  <p className="text-sm mt-1 text-white">{metadata.assembly_manufacturer || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">System</p>
                  <p className="text-sm mt-1 text-white">{metadata.system || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Asset Number</p>
                  <p className="text-sm mt-1 text-white">{metadata.asset_number || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-white/80">Description</p>
                  <p className="text-sm mt-1 text-white">{metadata.description || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Rebuild Item</p>
                  <p className="text-sm mt-1 text-white">{metadata.rebuild_item || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Approval Date</p>
                  <p className="text-sm mt-1 text-white">{metadata.approval_date || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">Total Cost</p>
                  <p className="text-sm mt-1 text-white">{metadata.total_cost ? `$${metadata.total_cost.toFixed(2)}` : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-muted p-4">
              <Image className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">No BOM Data Found</p>
              <p className="text-sm text-muted-foreground max-w-md">
                This sheet may contain images, drawings, or performance curves that cannot be displayed as tabular data.
              </p>
              {storagePath && (
                <Button onClick={handleDownload} variant="outline" className="mt-4">
                  <Download className="mr-2 h-4 w-4" />
                  Download Original File to View Images
                </Button>
              )}
            </div>
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
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEditingField({ itemId: item.id, field: "item_no", value: editedItem.item_no || "", rect });
                        }}
                        onBlur={() => setEditingField(null)}
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
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEditingField({ itemId: item.id, field: "description", value: editedItem.description || "", rect });
                        }}
                        onBlur={() => setEditingField(null)}
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
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEditingField({ itemId: item.id, field: "details", value: editedItem.details || "", rect });
                        }}
                        onBlur={() => setEditingField(null)}
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
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEditingField({ itemId: item.id, field: "manufacturer", value: editedItem.manufacturer || "", rect });
                        }}
                        onBlur={() => setEditingField(null)}
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
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEditingField({ itemId: item.id, field: "part_number", value: editedItem.part_number || "", rect });
                        }}
                        onBlur={() => setEditingField(null)}
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
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEditingField({ itemId: item.id, field: "item_code", value: editedItem.item_code || "", rect });
                        }}
                        onBlur={() => setEditingField(null)}
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
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEditingField({ itemId: item.id, field: "uom", value: editedItem.uom || "", rect });
                        }}
                        onBlur={() => setEditingField(null)}
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
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEditingField({ itemId: item.id, field: "sys_qty", value: String(editedItem.sys_qty || ""), rect });
                        }}
                        onBlur={() => setEditingField(null)}
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
                        onFocus={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEditingField({ itemId: item.id, field: "cost", value: String(editedItem.cost || ""), rect });
                        }}
                        onBlur={() => setEditingField(null)}
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

        {editingField && (
          <div 
            className="fixed z-50 bg-background border rounded-lg shadow-lg p-3 max-w-md"
            style={{
              top: `${editingField.rect.top - 60}px`,
              left: `${editingField.rect.left}px`,
            }}
          >
            <p className="text-xs text-muted-foreground mb-1 capitalize">
              {editingField.field.replace(/_/g, ' ')}
            </p>
            <p className="text-sm font-medium break-words">
              {editingField.value || '(empty)'}
            </p>
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

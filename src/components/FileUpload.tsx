import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

export const FileUpload = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
  const { toast } = useToast();

  const parseExcelFile = async (file: File, filePath: string) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Extract asset hierarchy from file path
    const pathParts = filePath.split("/");
    const fileName = pathParts[pathParts.length - 1].replace(".xlsx", "");
    
    // Create or get asset hierarchy entry
    let currentParentId = null;
    let fullPath = "";
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      fullPath += (i > 0 ? "/" : "") + part;
      
      const { data: existing } = await supabase
        .from("asset_hierarchy")
        .select("id")
        .eq("path", fullPath)
        .maybeSingle();

      if (existing) {
        currentParentId = existing.id;
      } else {
        const { data: newAsset } = await supabase
          .from("asset_hierarchy")
          .insert({
            name: part,
            parent_id: currentParentId,
            path: fullPath,
            level: i,
          })
          .select("id")
          .single();
        
        currentParentId = newAsset?.id || null;
      }
    }

    // Create asset entry for the file itself
    fullPath += (fullPath ? "/" : "") + fileName;
    const { data: assetData } = await supabase
      .from("asset_hierarchy")
      .insert({
        name: fileName,
        parent_id: currentParentId,
        path: fullPath,
        level: pathParts.length - 1,
      })
      .select("id")
      .single();

    if (!assetData) return;

    // Parse and insert BOM items
    const bomItems = jsonData.map((row: any) => ({
      asset_id: assetData.id,
      item_no: row["ITEM NO."]?.toString() || "",
      description: row["DESCRIPTION"] || "",
      details: row["DETAILS"] || "",
      manufacturer: row["MANUFACTURER"] || "",
      part_number: row["PART NUMBER"] || "",
      item_code: row["ITEM CODE"] || "",
      uom: row["UOM"] || "",
      sys_qty: row["SYS QTY"] ? parseFloat(row["SYS QTY"]) : null,
      cost: row["COST"] ? parseFloat(row["COST"]) : null,
    }));

    const { error: insertError } = await supabase
      .from("bom_items")
      .insert(bomItems);

    if (insertError) throw insertError;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await parseExcelFile(file, file.name);
      }

      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`,
      });
      
      onUploadSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".xlsx,.xls"
        multiple
        onChange={handleFileUpload}
      />
      <label htmlFor="file-upload">
        <Button asChild>
          <span className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload Excel Files
          </span>
        </Button>
      </label>
    </div>
  );
};

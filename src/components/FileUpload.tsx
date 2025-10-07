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

    // Parse first sheet to extract metadata
    const firstSheetName = workbook.SheetNames[0];
    const firstWorksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(firstWorksheet, { header: 1 }) as any[][];
    
    // Extract metadata from the first few rows
    let metadata: any = {};
    const metadataFields = [
      "Assembly Name", "Assembly Manufacturer", "Description", 
      "System", "Rebuild Item", "Asset Number", "Approval Date", "Total Cost"
    ];
    
    for (let i = 0; i < Math.min(20, rawData.length); i++) {
      const row = rawData[i];
      if (row && row[0]) {
        const fieldName = row[0].toString().trim();
        if (metadataFields.some(field => fieldName.toLowerCase().includes(field.toLowerCase()))) {
          const key = fieldName.toLowerCase().replace(/ /g, "_");
          metadata[key] = row[1] || "";
        }
      }
    }

    // Create asset entry for the file itself with metadata
    fullPath += (fullPath ? "/" : "") + fileName;
    const { data: assetData } = await supabase
      .from("asset_hierarchy")
      .insert({
        name: fileName,
        parent_id: currentParentId,
        path: fullPath,
        level: pathParts.length - 1,
        assembly_name: metadata.assembly_name,
        assembly_manufacturer: metadata.assembly_manufacturer,
        description: metadata.description,
        system: metadata.system,
        rebuild_item: metadata.rebuild_item,
        asset_number: metadata.asset_number,
        approval_date: metadata.approval_date,
        total_cost: metadata.total_cost ? parseFloat(metadata.total_cost) : null,
      })
      .select("id")
      .single();

    if (!assetData) return;

    // Parse and insert all sheets
    for (let sheetIndex = 0; sheetIndex < workbook.SheetNames.length; sheetIndex++) {
      const sheetName = workbook.SheetNames[sheetIndex];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Create sheet record
      const { data: sheetData } = await supabase
        .from("asset_sheets")
        .insert({
          asset_id: assetData.id,
          sheet_name: sheetName,
          sheet_index: sheetIndex,
        })
        .select("id")
        .single();

      if (!sheetData) continue;

      // Parse and insert BOM items for this sheet
      const bomItems = jsonData.map((row: any) => ({
        asset_id: assetData.id,
        sheet_id: sheetData.id,
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

      if (bomItems.length > 0) {
        const { error: insertError } = await supabase
          .from("bom_items")
          .insert(bomItems);

        if (insertError) throw insertError;
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Get the full path from webkitRelativePath if available (folder upload)
        const filePath = (file as any).webkitRelativePath || file.name;
        await parseExcelFile(file, filePath);
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
      <input
        type="file"
        id="folder-upload"
        className="hidden"
        accept=".xlsx,.xls"
        // @ts-ignore - webkitdirectory is not in the types but works in browsers
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFileUpload}
      />
      <label htmlFor="file-upload">
        <Button asChild>
          <span className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </span>
        </Button>
      </label>
      <label htmlFor="folder-upload">
        <Button asChild variant="outline">
          <span className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Upload Folder
          </span>
        </Button>
      </label>
    </div>
  );
};

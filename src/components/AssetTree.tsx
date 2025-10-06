import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Asset {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  level: number;
  children?: Asset[];
}

interface AssetTreeProps {
  onAssetSelect: (assetId: string, assetName: string) => void;
  selectedAssetId: string | null;
  refreshTrigger: number;
}

export const AssetTree = ({ onAssetSelect, selectedAssetId, refreshTrigger }: AssetTreeProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAssets();
  }, [refreshTrigger]);

  const loadAssets = async () => {
    const { data, error } = await supabase
      .from("asset_hierarchy")
      .select("*")
      .order("path");

    if (error) {
      console.error("Error loading assets:", error);
      return;
    }

    // Build tree structure
    const assetMap = new Map<string, Asset>();
    const rootAssets: Asset[] = [];

    data.forEach((asset) => {
      assetMap.set(asset.id, { ...asset, children: [] });
    });

    data.forEach((asset) => {
      const assetNode = assetMap.get(asset.id)!;
      if (asset.parent_id && assetMap.has(asset.parent_id)) {
        assetMap.get(asset.parent_id)!.children!.push(assetNode);
      } else {
        rootAssets.push(assetNode);
      }
    });

    setAssets(rootAssets);
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTree = (nodes: Asset[], level: number = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const isSelected = selectedAssetId === node.id;

      return (
        <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
          <div
            className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors ${
              isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
            }`}
            onClick={() => onAssetSelect(node.id, node.name)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="p-0 h-4 w-4"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
            {hasChildren ? (
              <Folder className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{node.name}</span>
          </div>
          {hasChildren && isExpanded && renderTree(node.children!, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="h-full overflow-auto">
      {assets.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4">
          No assets yet. Upload Excel files to get started.
        </p>
      ) : (
        renderTree(assets)
      )}
    </div>
  );
};

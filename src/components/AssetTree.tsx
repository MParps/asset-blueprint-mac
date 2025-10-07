import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, FileText, FolderPlus, Trash2, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  level: number;
  children?: Asset[];
}

interface AssetTreeProps {
  onAssetSelect: (assetId: string, assetName: string, assetPath: string) => void;
  selectedAssetId: string | null;
  refreshTrigger: number;
}

export const AssetTree = ({ onAssetSelect, selectedAssetId, refreshTrigger }: AssetTreeProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [contextMenuAsset, setContextMenuAsset] = useState<Asset | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAssets();
  }, [refreshTrigger]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAssets(assets);
    } else {
      const filtered = filterAssets(assets, searchQuery.toLowerCase());
      setFilteredAssets(filtered);
      // Auto-expand all nodes when searching
      if (filtered.length > 0) {
        const allIds = new Set<string>();
        const collectIds = (nodes: Asset[]) => {
          nodes.forEach(node => {
            allIds.add(node.id);
            if (node.children) collectIds(node.children);
          });
        };
        collectIds(assets);
        setExpandedNodes(allIds);
      }
    }
  }, [searchQuery, assets]);

  const filterAssets = (nodes: Asset[], query: string): Asset[] => {
    return nodes.reduce((acc: Asset[], node) => {
      const matches = node.name.toLowerCase().includes(query) || 
                     node.path.toLowerCase().includes(query);
      const filteredChildren = node.children ? filterAssets(node.children, query) : [];
      
      if (matches || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children
        });
      }
      return acc;
    }, []);
  };

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

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    const parentId = contextMenuAsset?.id || null;
    const parentPath = contextMenuAsset?.path || "";
    const newPath = parentPath ? `${parentPath}/${newFolderName}` : newFolderName;
    const level = contextMenuAsset ? contextMenuAsset.level + 1 : 0;

    const { error } = await supabase
      .from("asset_hierarchy")
      .insert({
        name: newFolderName,
        parent_id: parentId,
        path: newPath,
        level: level,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
      loadAssets();
    }

    setNewFolderName("");
    setShowNewFolderDialog(false);
  };

  const deleteAsset = async () => {
    if (!assetToDelete) return;

    const { error } = await supabase
      .from("asset_hierarchy")
      .delete()
      .eq("id", assetToDelete.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      loadAssets();
    }

    setShowDeleteDialog(false);
    setAssetToDelete(null);
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
        <ContextMenu key={node.id}>
          <ContextMenuTrigger>
            <div style={{ marginLeft: `${level * 20}px` }}>
              <div
                className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors ${
                  isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                }`}
                onClick={() => onAssetSelect(node.id, node.name, node.path)}
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
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                setContextMenuAsset(node);
                setShowNewFolderDialog(true);
              }}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setAssetToDelete(node);
                setShowDeleteDialog(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-2">
        <Input
          placeholder="Search assets or locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Button
          onClick={() => {
            setContextMenuAsset(null);
            setShowNewFolderDialog(true);
          }}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          New Root Folder
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {filteredAssets.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">
            {searchQuery ? "No assets found" : "No assets yet. Upload Excel files to get started."}
          </p>
        ) : (
          renderTree(filteredAssets)
        )}
      </div>

      <AlertDialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Folder</AlertDialogTitle>
            <AlertDialogDescription>
              {contextMenuAsset 
                ? `Create a new folder inside "${contextMenuAsset.name}"`
                : "Create a new root folder"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && createFolder()}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewFolderName("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={createFolder}>Create</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{assetToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAsset} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

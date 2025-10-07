import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { AssetTree } from "@/components/AssetTree";
import { BomTable } from "@/components/BomTable";
import logo from "@/assets/logo.png";

const Index = () => {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAssetName, setSelectedAssetName] = useState<string>("");
  const [selectedAssetPath, setSelectedAssetPath] = useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAssetSelect = (assetId: string, assetName: string, assetPath: string) => {
    setSelectedAssetId(assetId);
    setSelectedAssetName(assetName);
    setSelectedAssetPath(assetPath);
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="VRA Logo" className="h-16 w-16 object-contain" />
            <div>
              <h1 className="text-2xl font-bold">BOM Management System</h1>
              <p className="text-sm text-muted-foreground">Takoradi Thermal Power Station (TTPS-T1)</p>
            </div>
          </div>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-73px)]">
        <aside className="w-80 border-r bg-card">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Asset Hierarchy</h2>
          </div>
          <div className="p-4 h-[calc(100%-57px)]">
            <AssetTree
              onAssetSelect={handleAssetSelect}
              selectedAssetId={selectedAssetId}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </aside>
        
        <main className="flex-1 p-6">
          <BomTable assetId={selectedAssetId} assetName={selectedAssetName} assetPath={selectedAssetPath} />
        </main>
      </div>
    </div>
  );
};

export default Index;

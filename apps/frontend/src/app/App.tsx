import { useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import type { UserRole } from "@kroger-mini/contracts";
import { ApiClient } from "../shared/api/client.js";
import { FolderPanel } from "../features/folders/FolderPanel.js";
import { InventoryListPage } from "../features/inventory/InventoryListPage.js";
import { InventoryDetailPage } from "../features/inventory/InventoryDetailPage.js";
import { ScanBar } from "../features/inventory/ScanBar.js";
import "../styles/global.css";

export interface InventoryMfeProps {
  apiBaseUrl: string;
  userRole: UserRole;
  onNavigate?: (path: string) => void;
}

function AppInner({ apiBaseUrl, userRole, onNavigate }: InventoryMfeProps) {
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const api = useMemo(() => new ApiClient({ baseUrl: apiBaseUrl }), [apiBaseUrl]);
  const navigate = useNavigate();

  const goTo = (path: string) => {
    navigate(path);
    onNavigate?.(path);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Inventory Visibility</h1>
      </header>
      <ScanBar api={api} onResolved={(itemId) => goTo(`/inventory/${itemId}`)} />
      <div className="content-layout">
        <aside className="sidebar">
          <FolderPanel api={api} userRole={userRole} activeFolderId={activeFolderId} onSelectFolder={setActiveFolderId} />
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/inventory" replace />} />
            <Route path="/inventory" element={<InventoryListPage api={api} activeFolderId={activeFolderId} onOpenItem={(id) => goTo(`/inventory/${id}`)} />} />
            <Route path="/inventory/:id" element={<InventoryDetailPage api={api} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App(props: InventoryMfeProps) {
  return (
    <BrowserRouter>
      <AppInner {...props} />
    </BrowserRouter>
  );
}

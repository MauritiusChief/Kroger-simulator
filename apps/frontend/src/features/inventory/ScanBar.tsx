import { useState } from "react";
import { ApiClient } from "../../shared/api/client.js";

interface ScanBarProps {
  api: ApiClient;
  onResolved: (itemId: string) => void;
}

export function ScanBar({ api, onResolved }: ScanBarProps) {
  const [payload, setPayload] = useState("");
  const [message, setMessage] = useState("Ready");

  const resolve = async () => {
    if (!payload.trim()) {
      return;
    }
    const result = await api.resolveScan(payload);
    if (result.status === "resolved" && result.itemId) {
      setMessage(`Resolved -> ${result.itemId}`);
      onResolved(result.itemId);
      return;
    }
    setMessage(result.reason ?? "Unresolved payload");
  };

  return (
    <div className="scan-bar">
      <input
        aria-label="scan-input"
        placeholder="Simulate scan payload (UPC/EAN/QR)"
        value={payload}
        onChange={(event) => setPayload(event.target.value)}
      />
      <button onClick={resolve}>Resolve Scan</button>
      <span>{message}</span>
    </div>
  );
}

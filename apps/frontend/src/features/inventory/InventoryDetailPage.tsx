import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { InventoryItemDetail } from "@kroger-mini/contracts";
import { ApiClient } from "../../shared/api/client.js";

interface InventoryDetailPageProps {
  api: ApiClient;
}

function sparkline(points: number[]): string {
  const bars = "▁▂▃▄▅▆▇█";
  const max = Math.max(...points, 1);
  return points
    .map((value) => {
      const index = Math.min(bars.length - 1, Math.floor((value / max) * (bars.length - 1)));
      return bars[index];
    })
    .join("");
}

export function InventoryDetailPage({ api }: InventoryDetailPageProps) {
  const [item, setItem] = useState<InventoryItemDetail | null>(null);
  const params = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!params.id) {
      return;
    }
    void api.getItem(params.id).then(setItem);
  }, [api, params.id]);

  const trend7 = useMemo(() => sparkline((item?.trends7d ?? []).map((point) => point.value)), [item]);
  const trend30 = useMemo(() => sparkline((item?.trends30d ?? []).map((point) => point.value)), [item]);

  if (!item) {
    return <div>Loading item...</div>;
  }

  return (
    <section>
      <button onClick={() => navigate("/inventory")}>Back to list</button>
      <h2>{item.name}</h2>
      <p>{item.description}</p>
      <div className="detail-grid">
        <article>
          <h3>Sales Trends</h3>
          <p>7d: {trend7}</p>
          <p>30d: {trend30}</p>
        </article>
        <article>
          <h3>Store Stock</h3>
          <ul>
            {item.stores.map((store) => (
              <li key={store.storeId}>
                {store.storeName}: onHand {store.onHand}, reserved {store.reserved}
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h3>Alerts</h3>
          <ul>
            {item.alerts.map((alert) => (
              <li key={alert.id}>
                [{alert.severity}] {alert.message}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

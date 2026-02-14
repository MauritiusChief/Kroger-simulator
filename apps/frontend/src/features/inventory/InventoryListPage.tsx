import { useEffect, useMemo, useState } from "react";
import type { InventoryItemSummary, Tag } from "@kroger-mini/contracts";
import { ApiClient } from "../../shared/api/client.js";

interface InventoryListPageProps {
  api: ApiClient;
  activeFolderId?: string;
  onOpenItem: (id: string) => void;
}

export function InventoryListPage({ api, activeFolderId, onOpenItem }: InventoryListPageProps) {
  const [items, setItems] = useState<InventoryItemSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<"name" | "stock" | "sales">("sales");
  const [selected, setSelected] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [page] = useState(1);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  useEffect(() => {
    void api.listTags().then(setTags);
  }, [api]);

  useEffect(() => {
    void api
      .listInventory({
        page,
        pageSize: 20,
        keyword: keyword || undefined,
        folder: activeFolderId,
        sort
      })
      .then((response) => setItems(response.data));
  }, [api, page, keyword, activeFolderId, sort]);

  const toggle = (id: string) => {
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id]
    );
  };

  const applyTag = async () => {
    if (!selected.length || !selectedTag) {
      return;
    }
    await api.applyTags(selected, [selectedTag]);
    const response = await api.listInventory({ page: 1, pageSize: 20, keyword: keyword || undefined, folder: activeFolderId, sort });
    setItems(response.data);
    setSelected([]);
  };

  return (
    <section>
      <div className="toolbar">
        <input placeholder="Search by name or SKU" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <select value={sort} onChange={(event) => setSort(event.target.value as "name" | "stock" | "sales")}>
          <option value="sales">Sort: Sales 30d</option>
          <option value="stock">Sort: Stock</option>
          <option value="name">Sort: Name</option>
        </select>
        <select value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)}>
          <option value="">Select tag</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <button onClick={applyTag}>Bulk Apply Tag</button>
      </div>
      <table>
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Sales 30d</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  aria-label={`select-${item.id}`}
                  type="checkbox"
                  checked={selectedSet.has(item.id)}
                  onChange={() => toggle(item.id)}
                />
              </td>
              <td>
                <button className="link-button" onClick={() => onOpenItem(item.id)}>
                  {item.name}
                </button>
              </td>
              <td>{item.category}</td>
              <td>{item.currentStock}</td>
              <td>{item.sales30d}</td>
              <td>{item.tags.join(", ") || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

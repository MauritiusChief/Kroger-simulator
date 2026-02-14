import { useEffect, useMemo, useState } from "react";
import type { FolderNode, UserRole } from "@kroger-mini/contracts";
import { ApiClient } from "../../shared/api/client.js";

interface FolderPanelProps {
  api: ApiClient;
  userRole: UserRole;
  activeFolderId?: string;
  onSelectFolder: (folderId?: string) => void;
}

function flatten(nodes: FolderNode[], level = 0): Array<FolderNode & { level: number }> {
  return nodes.flatMap((node) => [
    { ...node, level },
    ...flatten(node.children ?? [], level + 1)
  ]);
}

function moveInTree(nodes: FolderNode[], folderId: string, parentId: string | null): FolderNode[] {
  const map = new Map<string, FolderNode>();
  const walk = (input: FolderNode[]) => {
    for (const node of input) {
      map.set(node.id, { ...node, children: [] });
      walk(node.children ?? []);
    }
  };
  walk(nodes);
  for (const node of map.values()) {
    if (!node.parentId) {
      continue;
    }
    map.get(node.parentId)?.children?.push(node);
  }
  const target = map.get(folderId);
  if (target) {
    target.parentId = parentId;
  }
  const roots = Array.from(map.values()).filter((node) => !node.parentId);
  return roots;
}

export function FolderPanel({ api, userRole, activeFolderId, onSelectFolder }: FolderPanelProps) {
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    void api.listFolders().then(setTree);
  }, [api]);

  const rows = useMemo(() => flatten(tree), [tree]);

  const onDrop = async (folderId: string, parentId: string | null) => {
    const previous = tree;
    setTree(moveInTree(tree, folderId, parentId));
    try {
      await api.patchFolder(folderId, { parentId });
      setError("");
    } catch {
      setTree(previous);
      setError("Folder move rejected by server.");
    }
  };

  return (
    <section>
      <h3>Folders</h3>
      <button onClick={() => onSelectFolder(undefined)}>All Items</button>
      {error ? <p className="error">{error}</p> : null}
      <ul className="folder-list">
        {rows.map((node) => (
          <li
            key={node.id}
            draggable={userRole === "manager"}
            onDragStart={(event) => event.dataTransfer.setData("text/plain", node.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const dragged = event.dataTransfer.getData("text/plain");
              if (dragged && dragged !== node.id && userRole === "manager") {
                void onDrop(dragged, node.id);
              }
            }}
            style={{ paddingLeft: `${node.level * 12}px` }}
          >
            <button className={node.id === activeFolderId ? "active-folder" : ""} onClick={() => onSelectFolder(node.id)}>
              {node.name}
            </button>
            <small>{userRole === "manager" ? "editable" : "read-only"}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
  const target = map.get(folderId);
  if (target) {
    target.parentId = parentId;
  }
  for (const node of map.values()) {
    if (!node.parentId) {
      continue;
    }
    map.get(node.parentId)?.children?.push(node);
  }
  const roots = Array.from(map.values()).filter((node) => !node.parentId);
  return roots;
}

export function FolderPanel({ api, userRole, activeFolderId, onSelectFolder }: FolderPanelProps) {
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [error, setError] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string>("");
  const [renameTargetId, setRenameTargetId] = useState<string>("");
  const [renameValue, setRenameValue] = useState("");

  const refreshTree = async () => {
    const latest = await api.listFolders();
    setTree(latest);
  };

  useEffect(() => {
    void refreshTree();
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

  const onCreate = async () => {
    if (!newFolderName.trim()) {
      return;
    }
    try {
      await api.createFolder({
        name: newFolderName.trim(),
        parentId: newFolderParentId || null
      });
      setNewFolderName("");
      setNewFolderParentId("");
      setError("");
      await refreshTree();
    } catch {
      setError("Folder create failed.");
    }
  };

  const startRename = (node: FolderNode) => {
    setRenameTargetId(node.id);
    setRenameValue(node.name);
  };

  const submitRename = async () => {
    if (!renameTargetId || !renameValue.trim()) {
      return;
    }
    try {
      await api.patchFolder(renameTargetId, { name: renameValue.trim() });
      setRenameTargetId("");
      setRenameValue("");
      setError("");
      await refreshTree();
    } catch {
      setError("Folder rename failed.");
    }
  };

  return (
    <section>
      <h3>Folders</h3>
      <button onClick={() => onSelectFolder(undefined)}>All Items</button>
      <button onClick={() => void refreshTree()}>Refresh</button>
      {error ? <p className="error">{error}</p> : null}
      {userRole === "manager" ? (
        <div className="folder-actions">
          <input
            aria-label="new-folder-name"
            placeholder="New folder name"
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
          />
          <select
            aria-label="new-folder-parent"
            value={newFolderParentId}
            onChange={(event) => setNewFolderParentId(event.target.value)}
          >
            <option value="">Root</option>
            {rows.map((node) => (
              <option key={`parent-${node.id}`} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
          <button onClick={() => void onCreate()}>Create Folder</button>
        </div>
      ) : null}
      <div
        data-testid="drop-root"
        className="folder-drop-root"
        onDragOver={(event) => {
          if (userRole === "manager") {
            event.preventDefault();
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (userRole !== "manager") {
            return;
          }
          const dragged = event.dataTransfer.getData("text/plain");
          if (dragged) {
            void onDrop(dragged, null);
          }
        }}
      >
        Drop here to move to root
      </div>
      <ul className="folder-list">
        {rows.map((node) => (
          <li
            key={node.id}
            data-testid={`folder-row-${node.id}`}
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
            <small title={userRole === "manager" ? "editable" : "read-only"}>{userRole === "manager" ? "⚙️" : "🔒"}</small>
            {/* <span data-testid={`folder-parent-${node.id}`}>{node.parentId ?? "root"}</span> */}
            {userRole === "manager" ? (
              <>
                {renameTargetId === node.id ? (
                  <span className="rename-controls">
                    <input
                      aria-label={`rename-${node.id}`}
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                    />
                    <button onClick={() => void submitRename()}>✔️</button>
                    <button
                      onClick={() => {
                        setRenameTargetId("");
                        setRenameValue("");
                      }}
                    >
                      ❌
                    </button>
                  </span>
                ) : (
                  <button onClick={() => startRename(node)}>✏️</button>
                )}
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

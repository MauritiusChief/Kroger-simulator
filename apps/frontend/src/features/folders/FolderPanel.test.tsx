import { render, screen } from "@testing-library/react";
import { FolderPanel } from "./FolderPanel.js";

const api = {
  listFolders: jest.fn().mockResolvedValue([
    {
      id: "root",
      name: "Root",
      parentId: null,
      permission: { manager: "edit", associate: "read" },
      children: []
    }
  ])
};

describe("FolderPanel", () => {
  it("shows role-based editability label", async () => {
    const { rerender } = render(
      <FolderPanel api={api as never} userRole="manager" onSelectFolder={jest.fn()} />
    );
    expect(await screen.findByText("editable")).toBeInTheDocument();
    rerender(<FolderPanel api={api as never} userRole="associate" onSelectFolder={jest.fn()} />);
    expect(await screen.findByText("read-only")).toBeInTheDocument();
  });
});

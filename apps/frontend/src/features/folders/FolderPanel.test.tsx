import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FolderPanel } from "./FolderPanel.js";

const api = {
  listFolders: jest.fn().mockResolvedValue([
    {
      id: "folder-root-1",
      name: "Produce",
      parentId: null,
      permission: { manager: "edit", associate: "read" },
      children: [
        {
          id: "folder-child-1",
          name: "Seasonal",
          parentId: "folder-root-1",
          permission: { manager: "edit", associate: "read" },
          children: []
        }
      ]
    }
  ]),
  createFolder: jest.fn().mockResolvedValue({
    id: "folder-new",
    name: "New Folder",
    parentId: null,
    permission: { manager: "edit", associate: "read" }
  }),
  patchFolder: jest.fn().mockResolvedValue({
    id: "folder-child-1",
    name: "Seasonal",
    parentId: null,
    permission: { manager: "edit", associate: "read" }
  })
};

describe("FolderPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows role-based editability label", async () => {
    const { rerender } = render(
      <FolderPanel api={api as never} userRole="manager" onSelectFolder={jest.fn()} />
    );
    await screen.findByTestId("folder-row-folder-root-1");
    expect(screen.getAllByText("editable")).toHaveLength(2);
    expect(screen.getByText("Create Folder")).toBeInTheDocument();
    expect(screen.getAllByText("Rename")).toHaveLength(2);
    rerender(<FolderPanel api={api as never} userRole="associate" onSelectFolder={jest.fn()} />);
    expect(await screen.findAllByText("read-only")).toHaveLength(2);
    expect(screen.queryByText("Create Folder")).not.toBeInTheDocument();
    expect(screen.queryByText("Rename")).not.toBeInTheDocument();
  });

  it("creates folder from manager controls", async () => {
    render(<FolderPanel api={api as never} userRole="manager" onSelectFolder={jest.fn()} />);
    await screen.findByTestId("folder-row-folder-root-1");
    fireEvent.change(screen.getByLabelText("new-folder-name"), { target: { value: "New Folder" } });
    fireEvent.click(screen.getByText("Create Folder"));

    await waitFor(() => {
      expect(api.createFolder).toHaveBeenCalledWith({ name: "New Folder", parentId: null });
    });
  });

  it("renames folder and supports root drop zone move", async () => {
    render(<FolderPanel api={api as never} userRole="manager" onSelectFolder={jest.fn()} />);
    await screen.findByTestId("folder-row-folder-child-1");

    fireEvent.click(screen.getAllByText("Rename")[1]);
    fireEvent.change(screen.getByLabelText("rename-folder-child-1"), { target: { value: "Seasonal Updated" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(api.patchFolder).toHaveBeenCalledWith("folder-child-1", { name: "Seasonal Updated" });
    });

    const dataTransfer = {
      setData: jest.fn(),
      getData: jest.fn().mockReturnValue("folder-child-1")
    };
    fireEvent.dragStart(screen.getByTestId("folder-row-folder-child-1"), { dataTransfer });
    fireEvent.drop(screen.getByTestId("drop-root"), { dataTransfer });

    await waitFor(() => {
      expect(api.patchFolder).toHaveBeenCalledWith("folder-child-1", { parentId: null });
    });
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InventoryListPage } from "./InventoryListPage.js";

describe("InventoryListPage", () => {
  it("sends bulk tag payload with selected item ids", async () => {
    const api = {
      listTags: jest.fn().mockResolvedValue([{ id: "tag-promo", name: "Promo", color: "#111111" }]),
      listInventory: jest.fn().mockResolvedValue({
        data: [
          {
            id: "item-1",
            name: "Milk",
            category: "Dairy",
            sku: "A",
            folderId: null,
            tags: [],
            currentStock: 1,
            sales7d: 1,
            sales30d: 1
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      }),
      applyTags: jest.fn().mockResolvedValue({ updatedCount: 1 })
    };

    render(<InventoryListPage api={api as never} onOpenItem={jest.fn()} />);
    await screen.findByText("Milk");

    fireEvent.click(screen.getByLabelText("select-item-1"));
    fireEvent.change(screen.getByDisplayValue("Select tag"), { target: { value: "tag-promo" } });
    fireEvent.click(screen.getByText("Bulk Apply Tag"));

    await waitFor(() => {
      expect(api.applyTags).toHaveBeenCalledWith(["item-1"], ["tag-promo"]);
    });
  });
});

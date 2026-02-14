import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App.js";

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body
  } as Response;
}

describe("App navigation", () => {
  it("navigates from list to detail", async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/folders")) {
        return jsonResponse([]);
      }
      if (url.includes("/api/tags")) {
        return jsonResponse([]);
      }
      if (url.includes("/api/inventory/items?")) {
        return jsonResponse({
          data: [
            {
              id: "item-1001",
              name: "Fresh Avocado Bag",
              category: "Produce",
              sku: "AVO",
              folderId: null,
              tags: [],
              currentStock: 120,
              sales7d: 52,
              sales30d: 211
            }
          ],
          page: 1,
          pageSize: 20,
          total: 1
        });
      }
      if (url.includes("/api/inventory/items/item-1001")) {
        return jsonResponse({
          id: "item-1001",
          name: "Fresh Avocado Bag",
          category: "Produce",
          sku: "AVO",
          folderId: null,
          tags: [],
          currentStock: 120,
          sales7d: 52,
          sales30d: 211,
          description: "desc",
          stores: [],
          trends7d: [],
          trends30d: [],
          alerts: []
        });
      }
      return jsonResponse({ status: "unresolved" });
    });

    Object.defineProperty(globalThis, "fetch", {
      writable: true,
      value: fetchMock
    });

    render(<App apiBaseUrl="http://localhost:4000" userRole="manager" />);
    const button = await screen.findByText("Fresh Avocado Bag");
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Fresh Avocado Bag" })).toBeInTheDocument());
  });
});

describe("Challenge 1 concurrency problem replay", () => {
  beforeEach(() => {
    cy.request("POST", "http://localhost:4000/api/dev/reset");
  });

  it("shows stale UI until refresh when another manager overwrites folder move", () => {
    cy.visit("/inventory");

    cy.contains("Seasonal").trigger("dragstart");
    cy.contains("Dairy").trigger("drop");
    cy.get('[data-testid="folder-parent-folder-child-1"]').should("contain", "folder-root-2");

    cy.request("PATCH", "http://localhost:4000/api/folders/folder-child-1", {
      parentId: "folder-root-1"
    }).its("status").should("eq", 200);

    cy.get('[data-testid="folder-parent-folder-child-1"]').should("contain", "folder-root-2");
    cy.reload();
    cy.get('[data-testid="folder-parent-folder-child-1"]').should("contain", "folder-root-1");
  });
});

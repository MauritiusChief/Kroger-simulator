describe("Folder move", () => {
  it("moves folder by drag/drop and still renders after refresh", () => {
    cy.visit("/inventory");
    cy.contains("Produce").trigger("dragstart");
    cy.contains("Dairy").trigger("drop");
    cy.reload();
    cy.contains("Folders");
  });
});

describe("Inventory flow", () => {
  it("filters and opens item detail and goes back", () => {
    cy.visit("/inventory");
    cy.get('input[placeholder="Search by name or SKU"]').type("blue");
    cy.contains("Organic Blueberries").click();
    cy.contains("Back to list").click();
    cy.url().should("include", "/inventory");
  });
});

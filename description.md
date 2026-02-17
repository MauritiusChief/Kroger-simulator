## **Project: Inventory Visibility Micro-Frontend & Aggregation Service**

### **Context**

To modernize Kroger’s internal inventory workflows without rebuilding the entire legacy system, this project delivered a new **Inventory Visibility Domain**. This consists of a **React micro-frontend** (embedded in a shared internal portal) and a **Node.js aggregation service** that normalizes data from different legacy backends for display.

### **Core Components Delivered**

**1\. Inventory Visibility Micro-Frontend (React/TypeScript)**

* **Hierarchical Organization:** File-system-like explorer, organize items into custom folders with drag-and-drop functionality. Folders support role-based access (e.g., Managers edit, Associates read-only).
* **Tagging System:** Tagging interface allowing bulk application of tags to items, enabling arbitrary categories beyond standard hierarchy.
* **Scanning Integration:** Browser-based scanning library to capture QR, UPC, and EAN codes via device cameras, resolving scanned data directly to item detail pages.
* **Data Visualization:** 7-day and 30-day sparkline trends for sales/stock history.
* **Endpoints**:
  * GET /api/inventory/items \- paginated list with filters, sort, and tag queries.
  * GET /api/inventory/items/:id \- item detail, stock by store, recent trends, and alerts.
  * GET /api/folders \- list tree, POST /api/folders and PATCH /api/folders/:id \- for CRUD.
  * GET /api/tags \- tag dictionary; bulk apply via POST /api/tags/apply

**2\. Inventory Aggregation Service (Node.js/Express)**
Acts as a **BFF (Backend for Frontend)** to insulate the UI from complex legacy systems.

* **Data Aggregation:** Fetches raw data from multiple upstream legacy APIs, normalizes inconsistent data models, and serves a unified JSON response to the frontend.
* **Scan Resolution Endpoint:** Endpoint that translates various raw barcode formats into canonical item IDs for the frontend.
  * POST /api/scans/resolve: resolves UPC/EAN/QR payloads to item detail or .
* **State Management:** Manages the persistence of user-specific data (custom folders, tags, and saved filters) that does not exist in the legacy ERP (Enterprise Resource Planning) systems.

### **Technical Implementation**

**Infrastructure & Deployment**

* **Containerization:** Services are Dockerized and deployed to **AWS EC2**.
* **Traffic Management:** Used **Canary deployments via Spinnaker**. Traffic is routed to the new version in increments (10% → 50% → 100%) to validate stability before full rollout.
* **Resiliency:** Configured automated rollbacks if error rates exceed 1% within the first 15 minutes of a deployment.

**Testing**

* **Jest** for unit and integration tests
* **Cypress** for end-to-end testing

**Observability**

* **Logging & Metrics:** Centralized logs in **Splunk**. Monitored API latency and error rates via **Grafana**.
* **Key Metrics:** **Scan Resolution Rate** (tracking successful barcode lookups) and **Aggregation Latency** (ensuring the BFF doesn't add significant delay over upstream legacy calls).

### **Challenge 1: Concurrency Conflicts in Shared Folder Management**

**Problem:**
Since the folder hierarchy is a shared resource, race conditions occurred when multiple managers attempted to reorganize the same file structure simultaneously.
**Solution:**
Implemented **Optimistic Concurrency Control (OCC)**.

* We attached a version number (or eTag) to each folder node.
* Update requests must include the current version. If the database version is higher than the client's (indicating a race condition), the server rejects the request.
  * All child folders will be updated once the parent folder is updated.
* Triggers a UI refresh, forcing the user to see the latest structure before attempting the move again. (request frequency is low, won’t affect much, reason for **OOC**)

### **Challenge 2: Data Difference Due to Legacy Sync Latency**

**Problem:**
The Aggregation Service consumes data from multiple legacy backends (*e.g., a batch-processed ERP and a real-time Store System*). Due to synchronization timing differences, these systems sometimes returned conflicting values for the same data point (*e.g., ERP showing "Stock: 100" while the Store System showed "Stock: 98"*).
**Solution:**
Established a **Prioritization Strategy (Source of Truth Ranking)**.

* We configured the aggregation logic to rank data sources based on "freshness" and reliability for specific fields.
  * Like inventory\_count, the service overrides the slower ERP data with the real-time Store System data.
* Partial Failure: if a high rank source failed, use the next highest source to substitute; If all failed, use stale data and show a warning in UI.

### **Challenge 1 Replay in This Miniature (Problem Baseline)**

1. Open two manager sessions (A/B), both at `/inventory`, with the same initial folder tree.
2. A moves `Seasonal` under `Dairy`.
3. B (without refresh) moves `Seasonal` under `Produce` or another parent.
4. Both updates succeed because this baseline intentionally has no OCC version check.
5. A refreshes and sees B's result (last write wins), reproducing the concurrency conflict symptom.

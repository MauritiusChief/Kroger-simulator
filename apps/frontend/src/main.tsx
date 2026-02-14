import { mount } from "./mfe/mount.js";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container not found.");
}

mount(container, {
  apiBaseUrl: "http://localhost:4000",
  userRole: "manager"
});

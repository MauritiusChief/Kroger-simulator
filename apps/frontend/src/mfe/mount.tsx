import { createRoot, type Root } from "react-dom/client";
import { App, type InventoryMfeProps } from "../app/App.js";

export interface MountedMfe {
  unmount: () => void;
}

export function mount(container: HTMLElement, props: InventoryMfeProps): MountedMfe {
  const root: Root = createRoot(container);
  root.render(<App {...props} />);
  return {
    unmount: () => root.unmount()
  };
}

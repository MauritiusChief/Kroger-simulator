export interface ScannerAdapter {
  open(): Promise<void>;
  close(): Promise<void>;
  onDetect(handler: (payload: string) => void): void;
}

export class MockScannerAdapter implements ScannerAdapter {
  private handler: ((payload: string) => void) | null = null;

  async open(): Promise<void> {
    return;
  }

  async close(): Promise<void> {
    return;
  }

  onDetect(handler: (payload: string) => void): void {
    this.handler = handler;
  }

  simulate(payload: string): void {
    this.handler?.(payload);
  }
}

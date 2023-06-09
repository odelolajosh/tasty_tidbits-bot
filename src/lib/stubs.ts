import { store } from "./store";

/**
 * StubCache class
 * This class is used to simulate a cache client
 * It is used for testing purposes
 */
export class StubCache {
  private static instance: StubCache;
  public client: any;

  private constructor() {
    this.client = {
      get: (key: string) => {
        const id = parseInt(key.split('_')[1]);
        const item = store.find(item => item.id === id);
        if (!item) return null;
        return item.initialQuantity;
      },
      set: (key: string, value: string) => { },
      del: (key: string) => { },
    }
  }

  public static getInstance(): StubCache {
    if (!StubCache.instance) {
      StubCache.instance = new StubCache();
    }
    return StubCache.instance;
  }
}
import { store } from "./store";
import { StubCache } from "./stubs";
import { Item } from "../global";

/**
 * Tray class
 * This class is used to simulate a tray of items
 */
export class Tray {
  private map = new Map<string, number>();
  private engaged = false;

  constructor(items: Item[] = []) {
    for (const item of items) {
      this.add(item.name, item.quantity);
    }
    if (items.length > 0) {
      this.engaged = true;
    }
  }

  getItem(name: string) {
    if (this.map.has(name)) {
      const quantity = this.map.get(name);
      if (quantity) {
        return { name, quantity };
      }
    }
    return null;
  }

  get items(): Item[] {
    return Array.from(this.map.entries()).map(([name, quantity]) => ({ name, quantity }));
  }

  add(name: string, quantity: number) {
    if (this.map.has(name)) {
      const available = this.map.get(name);
      if (available) {
        this.map.set(name, available + quantity);
      } else {
        this.map.set(name, quantity);
      }
    } else {
      this.map.set(name, quantity);
    }
    this.engaged = true;
  }

  get length() {
    return this.map.size;
  }

  empty() {
    this.map.clear();
  }

  isEmpty() {
    return this.map.size === 0;
  }

  get active() {
    return this.engaged;
  }

  set active(value: boolean) {
    this.engaged = value;
    if (!value) {
      this.empty()
    }
  }

}

const cache = StubCache.getInstance();

export const getStock = async () => {
  const stocks = []
  for (const item of store) {
    const quantity = await cache.client.get(`item_${item.id}`);
    const stock = { ...item, quantity: quantity ? parseInt(quantity) : item.initialQuantity };
    if (stock.quantity && stock.quantity > 0) stocks.push(stock);
  }
  return stocks;
}

const getCurrentReservedItemById = async (id: number) => {
  const item = store.find(item => item.id === id);
  if (!item) return null;
  const quantity = await cache.client.get(`item_${id}`);
  if (quantity) return { ...item, quantity: parseInt(quantity) };
  return { ...item, quantity: item.initialQuantity };
}

export const getCurrentReservedItem = async (name: string) => {
  const findItem = store.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (!findItem) return null;
  return getCurrentReservedItemById(findItem.id);
}

const reserveItemById = async (id: number, quantity=1) => {
  const reservedItem = await getCurrentReservedItemById(id);
  if (!reservedItem) return false;
  const remaining = reservedItem.quantity - quantity;
  if (remaining < 0) return false;
  cache.client.set(`item_${id}`, remaining);
  return true;
}

export const reserveItem = async (name: string, quantity=1) => {
  const item = store.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (!item) return false;
  return reserveItemById(item.id, quantity);
}

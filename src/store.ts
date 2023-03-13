import { Cache } from "./cache";
import { Item } from "./global";

export const store = [
  { id: 1, name: 'Pizza', price: 10.99, initialQuantity: 50 },
  { id: 2, name: 'Burger', price: 5.49, initialQuantity: 20 },
  { id: 3, name: 'Fries', price: 3.99, initialQuantity: 26 },
  { id: 4, name: 'Soda', price: 2.00, initialQuantity: 100 },
  { id: 5, name: 'Salad', price: 7.99, initialQuantity: 30 },
  { id: 6, name: 'Sandwich', price: 6.99, initialQuantity: 40 },
  { id: 7, name: 'Chicken', price: 8.99, initialQuantity: 70 },
]

export class OrderTray {
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
  }

}

const getCurrentReservedItemById = async (id: number) => {
  const cache = Cache.getInstance();
  const item = store.find(item => item.id === id);
  if (!item) return null;
  const quantity = await cache.client.get(`item_${id}`);
  // console.log('reserved item', quantity, 'of', item.name, 'left', item.initialQuantity);
  if (quantity) return { ...item, quantity: parseInt(quantity) };
  return { ...item, quantity: item.initialQuantity };
}

export const getCurrentReservedItem = async (name: string) => {
  const findItem = store.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (!findItem) return null;
  return getCurrentReservedItemById(findItem.id);
}

const reserveItemById = async (id: number, quantity=1) => {
  const cache = Cache.getInstance();
  const reservedItem = await getCurrentReservedItemById(id);
  if (!reservedItem) return false;
  const remaining = reservedItem.quantity - quantity;
  if (remaining < 0) return false;
  cache.client.set(`item_${id}`, remaining);
  // console.log(`set ${remaining} of item_${id}`);
  return true;
}

export const reserveItem = async (name: string, quantity=1) => {
  const item = store.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (!item) return false;
  return reserveItemById(item.id, quantity);
}

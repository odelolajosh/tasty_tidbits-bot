import { Session } from "express-session";

interface Item {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  items: Item[];
}

interface Data {
  botName: string;
  history: (Order & { at: Number })[];
  currentOrder: Order | null;
  isNewCustomer: boolean; 
}

declare module "http" {
  interface IncomingMessage {
    session: Session & {
      data: Partial<Data>;
    };
  }
}
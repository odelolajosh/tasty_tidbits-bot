import { createClient, RedisClientType } from "redis";

/** Cache class */
export class Cache {
  private static instance: Cache
  client: RedisClientType

  private constructor() {
    this.client = createClient()
    this.client.connect().catch(console.error)
  }

  /** Singleton pattern */
  static getInstance() {
    if (!Cache.instance) {
      Cache.instance = new Cache()
    }
    return Cache.instance
  }
}

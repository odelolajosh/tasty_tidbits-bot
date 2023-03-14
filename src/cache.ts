import { createClient, RedisClientType } from "redis";

/** Cache class */
export class Cache {
  private static instance: Cache
  client: RedisClientType

  private constructor() {
    this.client = createClient({
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT!),
      }
    })
    this.client.on('error', (err) => {
      console.log('Error ' + err)
    })
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

export interface CacheConfig {
  ttl: number;
  similarityThreshold: number;
}

export interface CacheEntry {
  embedding: number[];
  timestamp: number;
  filterName: string;
  filterValue: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

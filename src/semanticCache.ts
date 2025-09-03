import { Redis } from 'ioredis';
import { Ollama } from 'ollama';
import { CacheConfig, CacheEntry, RedisConfig } from './types';
import * as dotenv from 'dotenv';

dotenv.config();

export class SemanticCache {
  private redis: Redis;
  private config: CacheConfig;
  private ollama = new Ollama();

  constructor(redisConfig: RedisConfig, config: CacheConfig) {
    this.redis = new Redis(redisConfig);
    this.config = config;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.ollama.embeddings({
      model: 'nomic-embed-text',
      prompt: text,
    });
    return response.embedding;
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private async findSimilarCache(filterName: string, queryEmbedding: number[]): Promise<CacheEntry | null> {
    const cacheKeys = await this.redis.keys('semantic-cache:*');
    let mostSimilarEntry: CacheEntry | null = null;
    let highestSimilarity = -1;

    for (const key of cacheKeys) {
      const entry: CacheEntry = JSON.parse(await this.redis.get(key) || '');
      if (entry.filterName !== filterName) continue;
      const similarity = this.calculateCosineSimilarity(queryEmbedding, entry.embedding);
      if (similarity > highestSimilarity && similarity >= this.config.similarityThreshold) {
        highestSimilarity = similarity;
        mostSimilarEntry = entry;
      }
    }
    return mostSimilarEntry;
  }

  async get(filterName: string, filterValue: string): Promise<CacheEntry | null> {
    const queryEmbedding = await this.generateEmbedding(filterValue);
    const similarCache = await this.findSimilarCache(filterName, queryEmbedding);
    if (similarCache) {
      const age = Date.now() - similarCache.timestamp;
      if (age < this.config.ttl * 1000) {
        return similarCache;
      }
    }
    return null;
  }

  async set(filterName: string, filterValue: string): Promise<void> {
    const embedding = await this.generateEmbedding(filterValue);
    const entry: CacheEntry = {
      embedding,
      timestamp: Date.now(),
      filterName,
      filterValue,
    };
    const key = `semantic-cache:${Date.now()}`;
    await this.redis.set(key, JSON.stringify(entry));
  }

  async getTopK(filterName: string, filterValue: string, k: number = 5): Promise<CacheEntry[]> {
    const queryEmbedding = await this.generateEmbedding(filterValue);
    const cacheKeys = await this.redis.keys('semantic-cache:*');
    const scored: {entry: CacheEntry, similarity: number}[] = [];
    for (const key of cacheKeys) {
      const entry: CacheEntry = JSON.parse(await this.redis.get(key) || '');
      if (entry.filterName !== filterName) continue;
      const similarity = this.calculateCosineSimilarity(queryEmbedding, entry.embedding);
      if (similarity >= this.config.similarityThreshold) {
        scored.push({entry, similarity});
      }
    }
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, k).map(s => s.entry);
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

# Semantic Cache Service

A TypeScript service that implements semantic caching using Redis for storage and OpenAI's embeddings for semantic similarity matching.

## Features

- Semantic similarity matching using OpenAI embeddings
- Redis-based storage for cache entries
- Configurable TTL and similarity threshold
- Cosine similarity calculation for finding similar queries

## Prerequisites

- Node.js (v14 or higher)
- Redis server
- OpenAI API key

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a .env file based on .env.example and fill in your configuration:
```bash
cp src/.env.example src/.env
```

3. Update the .env file with your OpenAI API key and Redis configuration.

## Usage

Run the example:
```bash
npm start
```

Development mode with auto-reload:
```bash
npm run dev
```

Build the project:
```bash
npm run build
```

## How it Works

1. When caching a query:
   - Generates an embedding for the query using OpenAI's API
   - Stores the query, embedding, result, and timestamp in Redis

2. When retrieving from cache:
   - Generates an embedding for the input query
   - Searches for similar cached queries using cosine similarity
   - Returns the cached result if a similar query is found and hasn't expired
   - Returns null if no similar cache entry is found or if the cache has expired

## Configuration

- `REDIS_HOST`: Redis server host (default: localhost)
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis server password (optional)
- `OPENAI_API_KEY`: Your OpenAI API key
- `CACHE_TTL`: Time-to-live for cache entries in seconds (default: 3600)
- `SIMILARITY_THRESHOLD`: Minimum similarity score to consider a cache hit (default: 0.8)

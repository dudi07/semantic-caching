import { SemanticCache } from './semanticCache';
import * as dotenv from 'dotenv';

dotenv.config();

function getRandomFilterValues(count: number): string[] {
  const base = [
    'cat', 'dog', 'apple', 'banana', 'car', 'train', 'mountain', 'river', 'cloud', 'star',
    'book', 'phone', 'computer', 'tree', 'flower', 'bird', 'fish', 'house', 'city', 'country',
    'music', 'movie', 'painting', 'science', 'math', 'history', 'language', 'ocean', 'forest', 'desert',
    'robot', 'rocket', 'planet', 'galaxy', 'universe', 'energy', 'light', 'sound', 'color', 'shape',
    'emotion', 'happiness', 'sadness', 'anger', 'fear', 'love', 'friendship', 'family', 'work', 'play',
    'food', 'drink', 'sport', 'game', 'travel', 'holiday', 'festival', 'tradition', 'culture', 'art',
    'technology', 'innovation', 'discovery', 'adventure', 'exploration', 'nature', 'wildlife', 'weather', 'season', 'time',
    'future', 'past', 'present', 'dream', 'goal', 'challenge', 'success', 'failure', 'hope', 'memory',
    'school', 'university', 'teacher', 'student', 'lesson', 'class', 'exam', 'test', 'project', 'assignment',
    'health', 'medicine', 'doctor', 'nurse', 'hospital', 'treatment', 'disease', 'cure', 'prevention', 'care'
  ];
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base.slice(0, count);
}

async function app() {
  const cache = new SemanticCache(
    {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    {
      ttl: parseInt(process.env.CACHE_TTL || '3600'),
      similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.8'),
    }
  );

  const filterName = 'category';
  const filterValues = getRandomFilterValues(100);

  for (const filterValue of filterValues) {
    await cache.set(filterName, filterValue);
  }
  console.log('Inserted 100 random filterValue entries into cache.');

  const searchValue = 'dog';
  const top5 = await cache.getTopK(filterName, searchValue, 5);
  if (top5.length > 0) {
    console.log('Top 5 similar cached entries:');
    top5.forEach((entry, idx) => {
      console.log(`${idx + 1}. filterValue: ${entry.filterValue}`);
    });
  } else {
    console.log('No similar cached entries found.');
  }

  await cache.close();
}

app().catch(console.error);

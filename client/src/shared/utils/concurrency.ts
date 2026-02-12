export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const safeConcurrency = Number.isFinite(concurrency) ? Math.max(1, Math.floor(concurrency)) : 1;
  const results = new Array<R>(items.length);

  let nextIndex = 0;
  const workerCount = Math.min(safeConcurrency, items.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

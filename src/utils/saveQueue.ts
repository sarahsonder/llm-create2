// A minimal serial promise queue to avoid concurrent Firestore writes
// Ensures that write operations are executed in order to prevent races

type Task<T> = () => Promise<T>;

export class SaveQueue {
  private tail: Promise<unknown> = Promise.resolve();

  enqueue<T>(task: Task<T>): Promise<T> {
    const next = this.tail.then(() => task());
    // Ensure subsequent enqueues wait for this one (catch to avoid breaking the chain)
    this.tail = next.catch(() => {});
    return next;
  }

  flush(): Promise<void> {
    return this.tail.then(() => undefined);
  }
}

export const globalSaveQueue = new SaveQueue();

// Gives up on a slow task after `ms` milliseconds.
// Whichever finishes first wins: the real task, or the timer that throws.
export function withTimeout<T>(task: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}

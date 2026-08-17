let sequence = 0;

export function createLocalId(prefix = 'server'): string {
  sequence = (sequence + 1) % Number.MAX_SAFE_INTEGER;
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${sequence.toString(36)}_${random}`;
}

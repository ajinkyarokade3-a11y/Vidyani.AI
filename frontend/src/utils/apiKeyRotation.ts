export type ApiKeyEntry = {
  slot: number;
  value: string;
};

export class StickyApiKeyPool {
  private activeIndex = 0;

  constructor(
    private readonly provider: string,
    private readonly keys: ApiKeyEntry[]
  ) {
    if (keys.length === 0) {
      throw new Error(`No valid ${provider} API keys are configured.`);
    }
    console.info(`Loaded ${keys.length} ${provider} API keys.`);
  }

  async execute<T>(
    operation: (apiKey: string) => Promise<T>,
    isRetryable: (error: unknown) => boolean
  ): Promise<T> {
    let firstError: unknown;
    const startIndex = this.activeIndex;

    for (let offset = 0; offset < this.keys.length; offset += 1) {
      const index = (startIndex + offset) % this.keys.length;
      const apiKey = this.keys[index];
      try {
        const result = await operation(apiKey.value);
        this.activeIndex = index;
        return result;
      } catch (error: unknown) {
        if (!isRetryable(error)) {
          throw error;
        }
        firstError ??= error;
        console.warn(
          `${this.provider} quota/rate limit on key #${apiKey.slot}.`
        );
        if (offset < this.keys.length - 1) {
          const nextIndex = (startIndex + offset + 1) % this.keys.length;
          const nextKey = this.keys[nextIndex];
          this.activeIndex = nextIndex;
          console.warn(`Switching to ${this.provider} key #${nextKey.slot}.`);
        }
      }
    }

    throw firstError;
  }
}

export function loadApiKeys(
  numberedValues: Array<string | undefined>,
  legacyValue?: string
): ApiKeyEntry[] {
  const keys = numberedValues.flatMap((value, index) => {
    const normalized = value?.trim();
    return normalized ? [{ slot: index + 1, value: normalized }] : [];
  });

  const normalizedLegacy = legacyValue?.trim();
  if (keys.length === 0 && normalizedLegacy) {
    return [{ slot: 1, value: normalizedLegacy }];
  }
  return keys;
}

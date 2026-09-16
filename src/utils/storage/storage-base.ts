// Shared base class + types for the storage singleton.
// Values are limited to JSON-safe scalars/objects; retrieve() centralizes the
// "auto JSON parse, never throw, fall back on miss/parse-error" contract used
// by both the general (AsyncStorage) and secure (SecureStore) namespaces.

export type StorageItemValue = string | number | boolean | null | Record<string, any> | any[];

// Compile-time guard placeholder: ensures no new public method is added to
// Storage without being declared here first. Kept permissive on purpose.
export type AssertNoExtras<T extends string> = T;

export abstract class StorageBase {
  protected retrieve<Fallback extends StorageItemValue>(
    raw: string | null | undefined,
    fallback: Fallback,
  ): Fallback | null {
    if (raw === null || raw === undefined) return fallback;
    try {
      return JSON.parse(raw) as Fallback;
    } catch {
      return fallback;
    }
  }

  protected warn(op: string, key: string, e: unknown) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(`[storage] ${op} failed for "${key}"`, e);
    }
  }
}

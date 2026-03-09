import { createCollection } from '@tanstack/react-db';
import { localStorageCollectionOptions } from '@tanstack/react-db';
import { z } from 'zod/v4';

// --- Conversion History ---
const conversionSchema = z.object({
  id: z.string(),
  pluginName: z.string(),
  target: z.string(),
  outputPath: z.string(),
  filesCreated: z.number(),
  status: z.enum(['success', 'error']),
  error: z.optional(z.string()),
  createdAt: z.string(),
});

export type Conversion = z.infer<typeof conversionSchema>;

export const conversionsCollection = createCollection(
  localStorageCollectionOptions({
    id: 'conversions',
    storageKey: 'nde-conversions',
    getKey: (item: Conversion) => item.id,
    schema: conversionSchema,
  }),
);

export function addConversion(data: Omit<Conversion, 'id' | 'createdAt'>) {
  conversionsCollection.insert({
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
}

// --- Preferences ---
const preferenceSchema = z.object({
  id: z.string(),
  value: z.string(),
});

export type Preference = z.infer<typeof preferenceSchema>;

export const preferencesCollection = createCollection(
  localStorageCollectionOptions({
    id: 'preferences',
    storageKey: 'nde-preferences',
    getKey: (item: Preference) => item.id,
    schema: preferenceSchema,
  }),
);

export function getPreferenceValue(key: string): string | undefined {
  // Use a simple get from the collection state
  try {
    const item = conversionsCollection.state.get(key);
    return undefined; // Fallback for now
  } catch {
    return undefined;
  }
}

export function setPreference(key: string, value: string) {
  try {
    preferencesCollection.update(key, (draft) => {
      draft.value = value;
    });
  } catch {
    preferencesCollection.insert({ id: key, value });
  }
}

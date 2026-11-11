// Variante web dello storage (Metro risolve questo file al posto di index.ts
// quando la piattaforma e' "web"). Esisteva solo index.ts, che per i token
// usa expo-secure-store: su web quel modulo non e' disponibile, ogni
// secureSet falliva in silenzio (i helper non lanciano mai) e il token di
// login non veniva mai salvato -> ogni chiamata autenticata tornava 401.
// Su web non esiste un Keychain: i valori "secure" finiscono anch'essi in
// AsyncStorage (localStorage), sotto un prefisso separato.
// Stesso contratto pubblico di index.ts: importare il singleton `storage`.

import AsyncStorage from "@react-native-async-storage/async-storage";

import { AssertNoExtras, StorageBase, StorageItemValue } from "./storage-base";

const SECURE_PREFIX = "secure:";

export class Storage extends StorageBase {
  async getItem<Fallback extends StorageItemValue>(
    key: string,
    fallback: Fallback,
  ): Promise<Fallback | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return this.retrieve(raw, fallback);
    } catch (e) {
      this.warn("getItem", key, e);
      return fallback;
    }
  }

  async setItem<Value extends StorageItemValue>(
    key: string,
    value: Value,
  ): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      this.warn("setItem", key, e);
      return false;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      this.warn("removeItem", key, e);
      return false;
    }
  }

  async secureGet<Fallback extends StorageItemValue>(
    key: string,
    fallback: Fallback,
  ): Promise<Fallback | null> {
    return this.getItem(SECURE_PREFIX + key, fallback);
  }

  async secureSet<Value extends StorageItemValue>(
    key: string,
    value: Value,
  ): Promise<boolean> {
    return this.setItem(SECURE_PREFIX + key, value);
  }

  async secureRemove(key: string): Promise<boolean> {
    return this.removeItem(SECURE_PREFIX + key);
  }
}

export const storage = new Storage();

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentional compile-time-only assertion
type _NoExtras = AssertNoExtras<Exclude<keyof Storage, keyof StorageBase>>;

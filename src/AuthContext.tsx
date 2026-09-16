
import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "@/src/utils/storage";
import { api, TOKEN_KEY } from "@/src/api";

export type User = {
  id: string;
  email: string;
  nome?: string;
  cognome?: string;
  studio?: string;
  studio_id?: string;
  ruolo?: "Amministratore" | "Avvocato" | "Collaboratore" | "Segreteria" | string;
  push_token?: string | null;
};

type RegisterData = {
  email: string;
  password: string;
  nome?: string;
  cognome?: string;
  studio?: string;
  invite_token?: string;
  consenso_privacy: boolean;
};

type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({} as Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = async () => {
    const token = await storage.secureGet<string>(TOKEN_KEY, "");
    if (token) {
      try {
        const me = await api.get<User>("/auth/me");
        setUser(me);
      } catch {
        await storage.secureRemove(TOKEN_KEY);
        setUser(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => { bootstrap(); }, []);

  const login = async (email: string, password: string) => {
    const r = await api.post<{ access_token: string; user: User }>("/auth/login", { email, password });
    await storage.secureSet(TOKEN_KEY, r.access_token);
    setUser(r.user);
  };

  const register = async (data: RegisterData) => {
    const r = await api.post<{ access_token: string; user: User }>("/auth/register", data);
    await storage.secureSet(TOKEN_KEY, r.access_token);
    setUser(r.user);
  };

  const logout = async () => {
    await storage.secureRemove(TOKEN_KEY);
    setUser(null);
  };

  const refresh = async () => {
    try {
      const me = await api.get<User>("/auth/me");
      setUser(me);
    } catch {}
  };

  return <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

// Permessi lato client, a specchio di PERMISSIONS nel backend.
// Usati solo per nascondere/mostrare voci di UI: il backend applica comunque
// il controllo reale sugli endpoint, quindi questa lista non è una fonte di verità di sicurezza.
const PERMISSIONS: Record<string, Set<string>> = {
  Amministratore: new Set(["manage_team", "view_audit", "backup", "gdpr_admin", "billing", "delete_pratiche", "edit_pratiche"]),
  Avvocato: new Set(["manage_team", "view_audit", "billing", "delete_pratiche", "edit_pratiche"]),
  Collaboratore: new Set(["edit_pratiche"]),
  Segreteria: new Set([]),
};

export function useHasPerm(perm: string): boolean {
  const { user } = useAuth();
  const ruolo = user?.ruolo || "Avvocato";
  return PERMISSIONS[ruolo]?.has(perm) ?? false;
}

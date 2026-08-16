"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError, clearAuth, getStoredUser, getToken, setStoredUser, setToken } from "@/lib/api";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(() => !!getToken());
  const [initialized, setInitialized] = useState<boolean>(() => !getToken());

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(getStoredUser());
      setLoading(false);
      setInitialized(true);
      return null;
    }
    try {
      const me = await api.me();
      setUser(me);
      setStoredUser(me);
      return me;
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        clearAuth();
        setUser(null);
      }
      return null;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    let ignore = false;
    api
      .me()
      .then((me) => {
        if (!ignore) {
          setUser(me);
          setStoredUser(me);
        }
      })
      .catch((err) => {
        if (!ignore && err instanceof ApiClientError && err.status === 401) {
          clearAuth();
          setUser(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
          setInitialized(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user: u } = await api.login({ email, password });
      setToken(token);
      setStoredUser(u);
      setUser(u);
      setInitialized(true);
      return u;
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, full_name: string) => {
      const { token, user: u } = await api.register({ email, password, full_name });
      setToken(token);
      setStoredUser(u);
      setUser(u);
      setInitialized(true);
      return u;
    },
    [],
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  return { user, loading, initialized, login, register, logout, refresh };
}

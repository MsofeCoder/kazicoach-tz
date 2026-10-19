import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { cloud } from "./lib/cloud";
import { useApp } from "./context";
import {
  activePackage,
  launchPackages,
  type Entitlement,
  type Package,
} from "./lib/plans";
import { enqueue, flushQueue, type ProgressRow } from "./lib/sync";

interface AccountValue {
  session: Session | null;
  packages: Package[];
  entitlement: Entitlement | null;
  premium: "basic" | "plus" | null;
  admin: boolean;
  syncEnabled: boolean;
  rows: ProgressRow[];
  status: string;
  refresh(): Promise<void>;
  enableSync(): void;
  disableSync(): void;
  sync(): Promise<void>;
  whatsapp: string;
}
const AccountContext = createContext<AccountValue | null>(null);
export function AccountProvider({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const [session, setSession] = useState<Session | null>(null);
  const [packages, setPackages] = useState(launchPackages);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [admin, setAdmin] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [status, setStatus] = useState(
    "Private workspace. No progress uploaded.",
  );
  const generation = useRef(0);
  const owner = useRef<string | null>(null);
  const consent = useRef(false);
  const busy = useRef(false);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!cloud) return;
    let mounted = true;
    const update = (next: Session | null) => {
      if (!mounted) return;
      if (owner.current !== (next?.user.id ?? null)) {
        generation.current++;
        consent.current = false;
        owner.current = next?.user.id ?? null;
        setSyncEnabled(false);
        setRows([]);
        setEntitlement(null);
        setAdmin(false);
        setStatus(
          "Private workspace. Choose explicitly whether to sync progress to this account.",
        );
      }
      setSession(next);
    };
    void cloud.auth.getSession().then(({ data }) => update(data.session));
    const { data } = cloud.auth.onAuthStateChange((_event, next) =>
      update(next),
    );
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
      generation.current++;
    };
  }, []);
  const refresh = useCallback(async () => {
    if (!cloud) return;
    const epoch = generation.current;
    const user = owner.current;
    const products = await cloud.from("kc_packages").select("*");
    if (epoch !== generation.current) return;
    if (!products.error && products.data.length) setPackages(products.data);
    const contact = await cloud.from("kc_settings").select("whatsapp").single();
    if (epoch !== generation.current) return;
    if (!contact.error) setWhatsapp(contact.data.whatsapp);
    if (!user) return;
    const [access, role, progress] = await Promise.all([
      cloud
        .from("kc_entitlements")
        .select("package_id,starts_at,expires_at")
        .eq("user_id", user)
        .maybeSingle(),
      cloud.rpc("kc_is_admin"),
      cloud
        .from("kc_attempts")
        .select("*")
        .eq("user_id", user)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    if (epoch !== generation.current) return;
    if (access.error || role.error || progress.error) {
      setStatus("Cloud unavailable. Private practice is still available.");
      return;
    }
    setEntitlement(access.data);
    setAdmin(role.data === true);
    setRows(progress.data);
  }, []);
  useEffect(() => {
    void refresh();
  }, [session?.user.id, refresh]);
  const sync = useCallback(async () => {
    const user = owner.current;
    if (
      !cloud ||
      !user ||
      !consent.current ||
      busy.current ||
      !navigator.onLine
    )
      return;
    const client = cloud;
    const epoch = generation.current;
    busy.current = true;
    try {
      await flushQueue(
        localStorage,
        user,
        async (batch) => {
          const { error } = await client
            .from("kc_attempts")
            .upsert(batch, {
              onConflict: "user_id,id",
              ignoreDuplicates: true,
            });
          if (error) throw error;
        },
        () => consent.current && generation.current === epoch,
      );
      if (generation.current === epoch) {
        setStatus(
          "Selected progress synced. Answers and materials remain private.",
        );
        await refresh();
      }
    } catch {
      if (generation.current === epoch)
        setStatus(
          "Progress queued locally. Retry when connected; private practice still works.",
        );
    } finally {
      busy.current = false;
    }
  }, [refresh]);
  useEffect(() => {
    if (!syncEnabled || !session || !consent.current) return;
    const selected = state.attempts.filter(
      (attempt) => !rows.some((row) => row.id === attempt.id),
    );
    if (!selected.length) return;
    try {
      enqueue(localStorage, session.user.id, selected);
      void sync();
    } catch {
      setStatus(
        "Could not queue progress. Export your local workspace before retrying.",
      );
    }
  }, [state.attempts, session, syncEnabled, sync, rows]);
  useEffect(() => {
    const reconnect = () => {
      void sync();
      void refresh();
    };
    window.addEventListener("online", reconnect);
    const timer = window.setInterval(reconnect, 60_000);
    return () => {
      window.removeEventListener("online", reconnect);
      clearInterval(timer);
    };
  }, [sync, refresh]);
  const enableSync = () => {
    consent.current = true;
    setSyncEnabled(true);
  };
  const disableSync = () => {
    consent.current = false;
    generation.current++;
    setSyncEnabled(false);
    setStatus(
      "Sync paused. Pending summaries stay on this device for this account.",
    );
  };
  return (
    <AccountContext.Provider
      value={{
        session,
        packages,
        entitlement,
        premium: activePackage(entitlement),
        admin,
        rows,
        syncEnabled,
        status,
        refresh,
        enableSync,
        disableSync,
        sync,
        whatsapp,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}
export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("AccountProvider missing");
  return value;
}

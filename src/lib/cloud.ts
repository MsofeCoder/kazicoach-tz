import { createClient } from "@supabase/supabase-js";
import {canonicalHttpsOrigin,hostedEndpoint,publishableKey} from './deployment';

export function localCloudConfig(
  enabled: string | undefined,
  url: string | undefined,
  key: string | undefined,
  hostname: string,
) {
  if (
    enabled !== "true" ||
    !url ||
    !key ||
    !["localhost", "127.0.0.1"].includes(hostname)
  )
    return null;
  try {
    const endpoint = new URL(url);
    if (
      !["localhost", "127.0.0.1"].includes(endpoint.hostname) ||
      endpoint.protocol !== "http:" ||
      endpoint.username ||
      endpoint.password ||
      endpoint.pathname !== "/" ||
      endpoint.search ||
      endpoint.hash
    )
      return null;
    // Local CLI uses a legacy anon JWT; privileged JWTs and secret keys are rejected.
    const publishable = key.startsWith("sb_publishable_");
    const anon =
      !publishable && JSON.parse(atob(key.split(".")[1] || "")).role === "anon";
    return publishable || anon ? { url: endpoint.origin, key } : null;
  } catch {
    return null;
  }
}

export function hostedCloudConfig(url: string | undefined,key: string | undefined,origin: string,expectedOrigin: string | undefined) {
  const endpoint=hostedEndpoint(url);
  return endpoint && publishableKey(key) && canonicalHttpsOrigin(expectedOrigin)===origin
    ? {url:endpoint,key:key!}:null;
}
const hosted = import.meta.env.VITE_ACCOUNT_MODE === 'hosted';
const config = hosted ? hostedCloudConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  typeof location === 'undefined' ? '' : location.origin,
  import.meta.env.VITE_APP_ORIGIN,
) : localCloudConfig(
  import.meta.env.VITE_LOCAL_ACCOUNTS,
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  typeof location === "undefined" ? "" : location.hostname,
);
export const cloud = config
  ? createClient(config.url, config.key, {
      auth: { storageKey: hosted ? "kazicoach-account-auth" : "kazicoach-local-auth", detectSessionInUrl: false, flowType:'pkce' },
    })
  : null;

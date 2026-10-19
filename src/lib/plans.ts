export type PackageId = "basic" | "plus";
export interface Package {
  id: PackageId;
  price_tzs: number;
  duration_days: number;
  free_questions: number;
  daily_cloud_limit: number;
}
export interface Entitlement {
  package_id: PackageId;
  starts_at: string;
  expires_at: string;
}
export const launchPackages: Package[] = [
  {
    id: "basic",
    price_tzs: 3000,
    duration_days: 7,
    free_questions: 5,
    daily_cloud_limit: 100,
  },
  {
    id: "plus",
    price_tzs: 5000,
    duration_days: 7,
    free_questions: 5,
    daily_cloud_limit: 100,
  },
];
export function orderedPackages(packages: readonly Package[]): Package[] {
  const rank:Record<PackageId,number>={basic:0,plus:1};
  return [...packages].sort((a,b)=>rank[a.id]-rank[b.id]);
}

export function whatsappUpgradeUrl(phone:string, selected:Package):string|null {
  if(!/^[1-9][0-9]{7,14}$/.test(phone)) return null;
  const label=selected.id==='plus'?'Plus':'Basic';
  // Deliberate allowlist: never add an email, account ID, token, answer or material.
  const message=`Hello KaziCoach TZ, I would like Premium ${label} (TSh ${selected.price_tzs.toLocaleString('en-TZ')} for ${selected.duration_days} days). Please share payment and activation instructions.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
export function activePackage(
  entitlement: Entitlement | null,
  now = Date.now(),
): PackageId | null {
  if (!entitlement || !["basic", "plus"].includes(entitlement.package_id))
    return null;
  const starts = Date.parse(entitlement.starts_at),
    expires = Date.parse(entitlement.expires_at);
  if (
    !Number.isFinite(starts) ||
    !Number.isFinite(expires) ||
    starts > now ||
    expires <= now
  )
    return null;
  return entitlement.package_id;
}
export interface BillingProvider {
  enabled: boolean;
  requestActivation(): Promise<never>;
}
export const billing: BillingProvider = {
  enabled: false,
  async requestActivation() {
    throw new Error("Billing is disabled pending implementation approval.");
  },
};

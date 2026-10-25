import { useEffect, useRef, useState, type FormEvent } from "react";
import { accountEnvironment, cloud } from "../lib/cloud";
import { authFailure, type Notice, type NoticeTone } from '../lib/feedback';
import ActionNotice from './ActionNotice';
import {AdminSecurity} from './AdminSecurity';
import {RecoveryRequest} from './AccountRecovery';
import PasswordField from './PasswordField';
import {collectPages} from '../lib/export';
import { useAccount } from "../accounts";
import { summarizeProgress, queueKey, readQueue } from "../lib/sync";
import { orderedPackages, whatsappUpgradeUrl, type Package } from "../lib/plans";

type Testimonial = {
  id: string;
  display_name: string;
  body: string;
  status: string;
};
type Overview = {
  users: { user_id: string }[];
  testimonials: Testimonial[];
  audit: {
    id: number;
    action: string;
    target: string;
    created_at: string;
    details: Record<string, unknown>;
  }[];
};
function download(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
export function Plans() {
  const { packages, premium, entitlement, whatsapp } = useAccount();
  return (
    <article className="panel settings-section account-section">
      <h2>Choose your next step</h2>
      <p>
        Keep your preparation materials private. Free practice includes{" "}
        {packages.find((p) => p.id === "basic")?.free_questions ?? 5} scored
        questions per browser trial.
      </p>
      <div className="package-grid">
        {orderedPackages(packages).map((p) => (
          <div className="package-card" key={p.id}>
            <h3>Premium {p.id === "plus" ? "Plus" : "Basic"}</h3>
            <strong>
              TSh {p.price_tzs.toLocaleString("en-TZ")} / {p.duration_days} days
            </strong>
            <p>
              Unlimited local oral and written sessions, personalized questions,
              feedback, progress, XP, badges and milestones.
            </p>
            {p.id === "plus" && (
              <p>
                Five-member panel simulation, detailed analysis, improvement
                recommendations and advanced achievements.
              </p>
            )}
            <small>
              Cloud requests have an abuse limit of {p.daily_cloud_limit} per
              day.
            </small>
            {whatsappUpgradeUrl(whatsapp,p)&&<a className="button primary" href={whatsappUpgradeUrl(whatsapp,p)!} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Upgrade to {p.id==='plus'?'Plus':'Basic'} via WhatsApp</a>}
          </div>
        ))}
      </div>
      <p>
        {premium
          ? `Active: Premium ${premium}. Expires ${new Date(entitlement!.expires_at).toLocaleString("en-TZ", { timeZone: "Africa/Dar_es_Salaam" })}.`
          : "No active premium package."}
      </p>
      <p>
        Activation is arranged with the developer through WhatsApp after payment
        verification. Billing is disabled during review.
      </p>
      {!whatsapp && (
        <p>The developer’s WhatsApp contact is awaiting configuration.</p>
      )}
    </article>
  );
}
function PackageEditor({
  item,
  run,
}: {
  item: Package;
  run: (action: string, target: string, payload: object) => Promise<void>;
}) {
  const [draft, setDraft] = useState(item);
  return (
    <form
      className="account-form"
      onSubmit={(e) => {
        e.preventDefault();
        void run("package", item.id, draft);
      }}
    >
      <h3>Premium {item.id==='plus'?'Plus':'Basic'}</h3>
      {(
        [
          ["price_tzs", "Price (TSh)", 0, 10000000],
          ["duration_days", "Duration (days)", 1, 365],
          ["free_questions", "Free trial questions", 0, 100],
          ["daily_cloud_limit", "Daily cloud abuse limit", 1, 1000],
        ] as const
      ).map(([key, label, min, max]) => (
        <label key={key}>
          {label}
          <input
            type="number"
            required
            min={min}
            max={max}
            value={draft[key]}
            onChange={(e) =>
              setDraft({ ...draft, [key]: Number(e.target.value) })
            }
          />
        </label>
      ))}
      <button className="button secondary">Save package</button>
    </form>
  );
}
function Administration() {
  const { admin, packages, refresh,whatsapp } = useAccount();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [cursors,setCursors]=useState<Record<'users'|'testimonials'|'audit',string|null>>({users:null,testimonials:null,audit:null});
  const [target, setTarget] = useState("");
  const [plan, setPlan] = useState("basic");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(whatsapp);
  useEffect(()=>setPhone(whatsapp),[whatsapp]);
  if (!admin || !cloud) return null;
  const client = cloud;
  const load = async () => {
    const kinds=['users','testimonials','audit'] as const;
    const pages=await Promise.all(kinds.map(kind=>client.rpc('kc_admin_page',{kind,after_key:null})));
    if(pages.some(page=>page.error))setMessage('Could not load administration. Verify your authenticator and retry.');
    else {
      setOverview({users:pages[0].data.rows,testimonials:pages[1].data.rows,audit:pages[2].data.rows});
      setCursors({users:pages[0].data.next_cursor,testimonials:pages[1].data.next_cursor,audit:pages[2].data.next_cursor});
    }
  };
  const more=async(kind:'users'|'testimonials'|'audit')=>{
    const {data,error}=await client.rpc('kc_admin_page',{kind,after_key:cursors[kind]});
    if(error){setMessage('Page unavailable. Verify your authenticator and retry.');return;}
    setOverview(current=>current?({...current,[kind]:[...current[kind],...data.rows]} as Overview):current);
    setCursors(current=>({...current,[kind]:data.next_cursor}));
  };
  const run = async (action: string, id: string, payload: object) => {
    setMessage("Saving…");
    const { error } = await client.rpc("kc_admin_action", {
      action,
      target: id,
      payload,
    });
    setMessage(
      error
        ? "Action denied or invalid. Verify your authenticator, check the input and retry."
        : "Saved and audited.",
    );
    if (!error) {
      await refresh();
      await load();
    }
  };
  return (
    <article className="panel settings-section account-section">
      <h2>Super Admin</h2>
      <p>
        Manual activation follows payment verification outside the app. Package
        changes affect new activations; existing expiry dates stay fixed. Verify your authenticator before administrative actions. Use Load more to review additional records; account IDs can also be entered directly.
      </p>
      <button className="button secondary" onClick={() => void load()}>
        Load users, moderation and audit
      </button>
      {(['users','testimonials','audit'] as const).map(kind=>cursors[kind]&&<button className="button secondary" key={kind} onClick={()=>void more(kind)}>Load more {kind}</button>)}
      <form
        className="account-form"
        onSubmit={(e) => {
          e.preventDefault();
          void run("activate", target, { package_id: plan });
        }}
      >
        <label>
          Account ID
          <input
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            list="account-ids"
          />
        </label>
        <datalist id="account-ids">
          {overview?.users.map((u) => (
            <option key={u.user_id} value={u.user_id} />
          ))}
        </datalist>
        <label>
          Package
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="basic">Basic</option>
            <option value="plus">Plus</option>
          </select>
        </label>
        <button className="button primary">Activate after verification</button>
        <button
          type="button"
          className="button danger"
          disabled={!target}
          onClick={() => void run("revoke", target, {})}
        >
          Revoke access
        </button>
      </form>
      <div className="package-grid">
        {orderedPackages(packages).map((p) => (
          <PackageEditor
            key={`${p.id}-${p.price_tzs}-${p.duration_days}-${p.free_questions}-${p.daily_cloud_limit}`}
            item={p}
            run={run}
          />
        ))}
      </div>
      <form
        className="account-form"
        onSubmit={(e) => {
          e.preventDefault();
          void client
            .rpc("kc_set_contact", { phone })
            .then(async ({ error }) => {
              setMessage(
                error
                  ? "Contact change denied or invalid."
                  : "Contact saved and audited.",
              );
              await refresh();
            });
        }}
      >
        <label>
          Developer WhatsApp (international digits, no +)
          <input
            pattern="[1-9][0-9]{7,14}"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <button className="button secondary">Save contact setting</button>
      </form>
      {overview?.testimonials.map((t) => (
        <div className="moderation-item" key={t.id}>
          <strong>
            {t.display_name} · {t.status}
          </strong>
          <p>{t.body}</p>
          <button
            className="button secondary"
            onClick={() => void run("moderate", t.id, { status: "approved" })}
          >
            Approve
          </button>{" "}
          <button
            className="button danger"
            onClick={() => void run("moderate", t.id, { status: "rejected" })}
          >
            Reject / unpublish
          </button>
        </div>
      ))}
      {overview && (
        <details>
          <summary>
            Recent administrative audit ({overview.audit.length})
          </summary>
          <ul>
            {overview.audit.map((a) => (
              <li key={a.id}>
                {a.action} · {a.target} · {a.created_at}
                <pre>{JSON.stringify(a.details, null, 2)}</pre>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p role="status">{message}</p>
    </article>
  );
}
function AccountPanelContent({ notice, setNotice }: { notice: Notice | null; setNotice: (notice: Notice | null) => void }) {
  const account = useAccount();
  const {
    session,
    rows,
    syncEnabled,
    status,
    refresh,
    enableSync,
    disableSync,
    sync,
  } = account;
  const setMessage = (message: string, tone: NoticeTone = 'info') => setNotice({message, tone, title: tone === 'error' ? 'Action could not be completed' : tone === 'success' ? 'Action completed' : tone === 'loading' ? 'Please wait' : 'Account update'});
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");
  const [consent, setConsent] = useState(false);
  const [publicItems, setPublicItems] = useState<Testimonial[] | null>(null);
  const exportIdentity=useRef(session?.user.id??null);
  useEffect(()=>{exportIdentity.current=session?.user.id??null;return()=>{exportIdentity.current=null;};},[session?.user.id]);
  const summary = summarizeProgress(rows);
  async function signOut() {
    setEmail(''); setPassword(''); disableSync();
    try {
      const result=await cloud!.auth.signOut({scope:'local'});
      if(result.error) setMessage('Sign-out did not complete. Please retry.', 'error');
      else setMessage('You are signed out. Your private workspace is still available.', 'success');
    } catch {setMessage('Sign-out did not complete. Please retry.', 'error');}
  }
  async function authenticate(event: FormEvent, signup = false) {
    event.preventDefault();
    if (!cloud || busy) return;
    setBusy(true);
    setMessage(signup ? 'Creating your account…' : 'Signing you in…', 'loading');
    try {
      const result = signup
        ? await cloud.auth.signUp({ email: email.trim(), password, options:{emailRedirectTo:new URL(`${location.pathname}?kc_auth=1`,location.origin).href} })
        : await cloud.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) setNotice(authFailure(result.error, accountEnvironment === 'local'));
      else setMessage(signup ? accountEnvironment === 'local'
        ? 'Registration accepted. Check the local test inbox if confirmation is required; no real email is sent.'
        : 'Registration accepted. If eligible, check your inbox and Spam folder for confirmation and open it in this browser.'
        : 'You are signed in. Progress sync remains your choice.', 'success');
      setPassword("");
    } catch (error) {
      setNotice(authFailure(error, accountEnvironment === 'local'));
    } finally {
      setBusy(false);
    }
  }
  async function exportAccount() {
    if (!cloud || !session) return;
    try {
      const results = await Promise.all(
        [
          "kc_profiles",
          "kc_attempts",
          "kc_entitlements",
          "kc_testimonials",
        ].map(async (table) => {
          return collectPages(async(offset,size)=>{
            const { data, error } = await cloud!
              .from(table)
              .select("*")
              .eq("user_id", session.user.id)
              .order(
                table === "kc_attempts" || table === "kc_testimonials"
                  ? "id"
                  : "user_id",
              )
              .range(offset, offset + size - 1);
            if (error) throw error;
            return data;
          },()=>exportIdentity.current===session.user.id);
        }),
      );
      const current=await cloud.auth.getSession();
      if(current.data.session?.user.id!==session.user.id) throw new Error('Account changed during export');
      download("kazicoach-account-export.json", {
        exportedAt: new Date().toISOString(),
        accountId: session.user.id,
        profile: results[0],
        progress: results[1],
        entitlements: results[2],
        testimonials: results[3],
        pendingProgress: readQueue(localStorage, session.user.id),
      });
      setMessage(
        "Account export downloaded. Local workspace has a separate export below.", 'success',
      );
    } catch {
      setMessage("Export failed. Retry when connected.", 'error');
    }
  }
  async function deleteAccount() {
    if (
      !cloud ||
      !session ||
      !window.confirm(
        "Permanently delete this account and its cloud progress, profile, entitlement and testimonial? Your private workspace stays in this browser.",
      )
    )
      return;
    disableSync();
    const { error } = await cloud.rpc("kc_delete_account");
    if (error) {
      setMessage(
        "Deletion failed. Super Admin must transfer administration first; otherwise reconnect and retry.", 'error',
      );
      return;
    }
    localStorage.removeItem(queueKey(session.user.id));
    await cloud.auth.signOut({ scope: "local" });
    setMessage("Account deleted. Your private workspace is still available.", 'success');
  }
  async function submitTestimonial(event: FormEvent) {
    event.preventDefault();
    if (!cloud || !session || !consent) return;
    const { error } = await cloud
      .from("kc_testimonials")
      .insert({
        user_id: session.user.id,
        display_name: displayName.trim(),
        body: body.trim(),
      });
    setMessage(
      error
        ? "Unable to submit. Withdraw an existing submission before replacing it."
        : "Submitted privately for review. It becomes public only after approval.", error ? 'error' : 'success',
    );
    if (!error) {
      setBody("");
      setConsent(false);
    }
  }
  return (
    <>
      <article className="panel settings-section account-section">
        <h2 data-tour="account">Optional account &amp; selected progress</h2>
        {accountEnvironment === 'local' && <div className="account-environment"><strong>Local preview · test accounts only</strong><p>Your real KaziCoach account belongs to staging. Sign-in and password reset here use a separate local test service and inbox.</p><a className="button secondary" href="https://staging.kazicoach-tz-441.pages.dev/">Open staging for your real account</a></div>}
        {session && <ActionNotice notice={notice} />}
        {!cloud ? (
          <p>
            Private mode is active. Accounts require an
            explicitly configured account service. No account service
            is connected.
          </p>
        ) : !session ? (
          <form className="account-form" aria-busy={busy} onSubmit={(e) => void authenticate(e)}>
            <label>
              Email
              <input
                type="email"
                name="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                onFocus={event=>event.currentTarget.select()}
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
              <PasswordField
                label="Password"
                minLength={8}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            <button className="button primary" disabled={busy}>
              {busy ? 'Please wait…' : 'Sign in'}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy || !email || password.length < 12}
              onClick={(e) => void authenticate(e, true)}
            >
              Create account
            </button>
            <small>New accounts need at least 12 characters, with uppercase/lowercase letters, numbers and a symbol.</small>
          </form>
        ) : (
          <>
            <p>
              Signed in as {session.user.email}.{" "}
              <small>Account ID: {session.user.id}</small>
            </p>
            <p>
              Sync selects scores, question IDs, categories, modes, timestamps
              and durations, including existing attempts in this browser.
              Answers, CVs, files and custom question text stay local. On shared
              devices, review the workspace before selecting it.
            </p>
            <div className="data-actions">
              {!syncEnabled ? (
                <button className="button primary" onClick={enableSync}>
                  Select this workspace’s progress for sync
                </button>
              ) : (
                <>
                  <button className="button secondary" onClick={disableSync}>
                    Pause sync
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => void sync()}
                  >
                    Retry sync
                  </button>
                </>
              )}
              <button
                className="button secondary"
                onClick={() => void refresh()}
              >
                Refresh access
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  void signOut();
                }}
              >
                Sign out
              </button>
              <button
                className="button secondary"
                onClick={() => void exportAccount()}
              >
                Export account data
              </button>
              <button
                className="button danger"
                onClick={() => void deleteAccount()}
              >
                Delete account
              </button>
            </div>
            <p role="status">{status}</p>
            <p>
              Cloud progress (most recent 1,000): {summary.count} attempts ·{" "}
              {summary.xp} XP · {summary.streak} day streak. Your private
              workspace remains separate.
            </p>
            <form
              className="account-form"
              onSubmit={(e) => {
                e.preventDefault();
                void cloud!
                  .from("kc_profiles")
                  .upsert({
                    user_id: session.user.id,
                    display_name: displayName.trim(),
                  })
                  .then(({ error }) =>
                    setMessage(
                      error ? "Could not save profile." : "Display name saved.", error ? 'error' : 'success',
                    ),
                  );
              }}
            >
              <label>
                Account display name
                <input
                  required
                  minLength={1}
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
              <button className="button secondary">Save display name</button>
            </form>
            <form
              className="account-form"
              onSubmit={(e) => void submitTestimonial(e)}
            >
              <h3>Share your experience</h3>
              <p>
                Your chosen display name and text will be public only after
                moderation. Exclude private contact details.
              </p>
              <label>
                Public display name
                <input
                  required
                  minLength={1}
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
              <label>
                Your testimonial
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </label>
              <label className="consent-label">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                I agree to public display of this name and testimonial after
                approval.
              </label>
              <button className="button secondary" disabled={!consent}>
                Submit for review
              </button>
              <button
                className="button danger"
                type="button"
                onClick={() => {
                  void cloud!
                    .from("kc_testimonials")
                    .delete()
                    .eq("user_id", session.user.id)
                    .then(({ error }) => {
                      setPublicItems(null);
                      setMessage(
                        error
                          ? "Could not withdraw. Retry when connected."
                          : "Testimonial withdrawn, including any public version.", error ? 'error' : 'success',
                      );
                    });
                }}
              >
                Withdraw my testimonial
              </button>
            </form>
          </>
        )}
        {!session && <ActionNotice notice={notice} />}
        {!session && <RecoveryRequest initialEmail={email} onOpen={() => setNotice(null)} />}
        {cloud && (
          <>
            <button
              className="button secondary"
              onClick={() => {
                void cloud!
                  .rpc("kc_public_testimonials")
                  .then(({ data, error }) => {
                    if (error) setMessage("Public testimonials unavailable. Check your connection and try again.", 'error');
                    else {setPublicItems(data);setMessage(data?.length ? 'Approved testimonials loaded.' : 'There are no approved testimonials yet.', 'info');}
                  });
              }}
            >
              Read approved testimonials
            </button>
            {publicItems?.map((t) => (
              <blockquote key={t.id}>
                <p>{t.body}</p>
                <cite>{t.display_name}</cite>
              </blockquote>
            ))}
            {publicItems?.length === 0 && <p>No approved testimonials yet.</p>}
          </>
        )}
      </article>
      <Plans />
      <AdminSecurity />
      <Administration />
    </>
  );
}

export default function AccountPanel() {
  const {session}=useAccount();
  const [notice, setNotice] = useState<Notice | null>(null);
  // Recreate account-specific form state on logout, expiry or account switching.
  return <AccountPanelContent key={session?.user.id??'guest'} notice={notice} setNotice={setNotice}/>;
}

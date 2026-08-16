import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, KeyRound, Trash2, X } from "lucide-react";
import { Card } from "../../components/Card";
import { ErrorBanner } from "../../components/ErrorBanner";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useAuth } from "../../context/AuthContext";
import type { DigestFrequency } from "../../api/users";
import {
  useChangePassword,
  useCreateShareLink,
  useDeleteAccount,
  useRevokeShareLink,
  useUpdateProfile,
} from "../../hooks/useAccount";
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from "../../hooks/useApiKeys";

function EmailVerificationStatus() {
  const { user, resendVerification } = useAuth();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  if (!user) return null;

  if (user.email_verified) {
    return (
      <Badge className="flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Verified
      </Badge>
    );
  }

  if (state === "sent") {
    return <span className="text-xs text-neutral-500">Verification email sent</span>;
  }

  async function handleClick() {
    setState("sending");
    try {
      await resendVerification();
      setState("sent");
    } catch {
      setState("idle");
    }
  }

  return (
    <Button size="sm" variant="danger" onClick={handleClick} disabled={state === "sending"}>
      {state === "sending" ? "Sending…" : "Verify email"}
    </Button>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    updateProfile.mutate(
      { display_name: displayName || null, username, email },
      { onSuccess: () => setSaved(true) }
    );
  }

  return (
    <Card>
      <h2 className="mb-3 font-semibold">Profile</h2>
      {updateProfile.error && <div className="mb-3"><ErrorBanner message={updateProfile.error.message} /></div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Display name</label>
          <Input className="w-full" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Username</label>
          <Input
            className="w-full"
            value={username}
            pattern="[a-z0-9_]+"
            minLength={3}
            maxLength={30}
            onChange={(e) => { setUsername(e.target.value.toLowerCase()); setSaved(false); }}
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs text-neutral-500">Email</label>
            <EmailVerificationStatus />
          </div>
          <Input
            type="email"
            className="w-full"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSaved(false); }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={updateProfile.isPending}>
            Save changes
          </Button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved.</span>}
        </div>
      </form>
    </Card>
  );
}

function PasswordSection() {
  const { user } = useAuth();
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatchError, setMismatchError] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user?.has_password) {
    return (
      <Card>
        <h2 className="mb-1 font-semibold">Password</h2>
        <p className="text-sm text-neutral-500">You sign in with Google, so there's no password to change.</p>
      </Card>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMismatchError(true);
      return;
    }
    setMismatchError(false);
    setSaved(false);
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setSaved(true);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      }
    );
  }

  return (
    <Card>
      <h2 className="mb-3 font-semibold">Password</h2>
      {changePassword.error && <div className="mb-3"><ErrorBanner message={changePassword.error.message} /></div>}
      {mismatchError && <div className="mb-3"><ErrorBanner message="New passwords do not match" /></div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="password"
          required
          className="w-full"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <Input
          type="password"
          required
          minLength={8}
          className="w-full"
          placeholder="New password (min 8 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          type="password"
          required
          minLength={8}
          className="w-full"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={changePassword.isPending}>
            Change password
          </Button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400">Password updated.</span>}
        </div>
      </form>
    </Card>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteAccount = useDeleteAccount();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    const payload = user?.has_password ? { password } : { confirmation };
    deleteAccount.mutate(payload, { onSuccess: () => navigate("/") });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-sm rounded-md border border-neutral-200 bg-white p-4 shadow-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent-500/60 before:to-transparent dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-red-600 dark:text-red-400">Delete account</h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>
        <p className="mb-3 text-sm text-neutral-500">
          This permanently deletes your account and all subjects, topics, sessions, and goals. This cannot be undone.
        </p>
        {deleteAccount.error && <div className="mb-3"><ErrorBanner message={deleteAccount.error.message} /></div>}
        <form onSubmit={handleDelete} className="space-y-3">
          {user?.has_password ? (
            <Input
              type="password"
              required
              className="w-full"
              placeholder="Enter your password to confirm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          ) : (
            <Input
              type="text"
              required
              className="w-full"
              placeholder={`Type "${user?.username}" to confirm`}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={deleteAccount.isPending}>
              Delete my account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DigestSection() {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  if (!user) return null;

  return (
    <Card>
      <h2 className="mb-1 font-semibold">Progress digest email</h2>
      <p className="mb-3 text-sm text-neutral-500">
        Get an email recapping topics completed, minutes studied, and your streak.
      </p>
      <Select
        value={user.digest_frequency}
        onChange={(e) => updateProfile.mutate({ digest_frequency: e.target.value as DigestFrequency })}
        disabled={updateProfile.isPending}
      >
        <option value="off">Off</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </Select>
    </Card>
  );
}

function SharingSection() {
  const { user } = useAuth();
  const createShareLink = useCreateShareLink();
  const revokeShareLink = useRevokeShareLink();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const shareUrl = user.share_token ? `${window.location.origin}/share/${user.share_token}` : null;

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <h2 className="mb-1 font-semibold">Sharing</h2>
      <p className="mb-3 text-sm text-neutral-500">
        Generate a read-only link showing your overall progress — no login required, no subject or topic details.
      </p>
      {shareUrl ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input className="flex-1" readOnly value={shareUrl} />
            <IconButton icon={Copy} label="Copy link" onClick={handleCopy} />
          </div>
          {copied && <span className="text-sm text-green-600 dark:text-green-400">Copied!</span>}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={createShareLink.isPending}
              onClick={() => createShareLink.mutate()}
            >
              Regenerate
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={revokeShareLink.isPending}
              onClick={() => revokeShareLink.mutate()}
            >
              Revoke
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="primary" disabled={createShareLink.isPending} onClick={() => createShareLink.mutate()}>
          Generate share link
        </Button>
      )}
    </Card>
  );
}

function ApiKeysSection() {
  const { data: keys, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();
  const [name, setName] = useState("");
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createKey.mutate(name.trim(), {
      onSuccess: (created) => {
        setNewSecret(created.key);
        setName("");
      },
    });
  }

  function handleCopy() {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <h2 className="mb-1 font-semibold">MCP API keys</h2>
      <p className="mb-3 text-sm text-neutral-500">
        Connect Claude Desktop or Claude Code to your study data as a remote MCP server:{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
          claude mcp add --transport http &lt;server-url&gt;/mcp/ --header "Authorization: Bearer &lt;key&gt;"
        </code>
      </p>

      {createKey.error && <div className="mb-3"><ErrorBanner message={createKey.error.message} /></div>}

      {newSecret && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
          <p className="mb-2 font-medium">Copy this key now — you won't be able to see it again.</p>
          <div className="flex items-center gap-2">
            <Input className="flex-1 font-mono text-xs" readOnly value={newSecret} />
            <IconButton icon={Copy} label="Copy key" onClick={handleCopy} />
          </div>
          {copied && <span className="mt-1 block text-green-600 dark:text-green-400">Copied!</span>}
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-3 flex items-center gap-2">
        <Input
          className="flex-1"
          placeholder="Key name (e.g. Claude Desktop)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" variant="primary" icon={KeyRound} disabled={createKey.isPending || !name.trim()}>
          Create key
        </Button>
      </form>

      {!isLoading && keys?.length === 0 && <p className="text-sm text-neutral-500">No API keys yet.</p>}

      {keys && keys.length > 0 && (
        <ul className="space-y-2">
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <div>
                <div className="font-medium">{key.name}</div>
                <div className="text-xs text-neutral-500">
                  {key.key_prefix}… · {key.last_used_at ? `last used ${new Date(key.last_used_at).toLocaleDateString()}` : "never used"}
                </div>
              </div>
              <IconButton
                icon={Trash2}
                label="Revoke key"
                onClick={() => deleteKey.mutate(key.id)}
                disabled={deleteKey.isPending}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DangerZone() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <Card>
      <h2 className="mb-1 font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
      <p className="mb-3 text-sm text-neutral-500">Permanently delete your account and all of your data.</p>
      <Button variant="danger" icon={Trash2} onClick={() => setModalOpen(true)}>
        Delete account
      </Button>
      {modalOpen && <DeleteAccountModal onClose={() => setModalOpen(false)} />}
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="max-w-lg space-y-6">
      <ProfileSection />
      <PasswordSection />
      <DigestSection />
      <SharingSection />
      <ApiKeysSection />
      <DangerZone />
    </div>
  );
}

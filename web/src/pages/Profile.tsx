import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { Eye, EyeOff, Lock, Pencil, ShieldCheck, User as UserIcon } from 'lucide-react';
import { auth, db } from '../firebase';
import { useAuth } from '../context/useAuth';
import LoadingButton from '../components/ui/LoadingButton';
import { useToast } from '../components/ui/Toast';

interface PasswordErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AD'
  );
}

function inputClass(hasError = false, readOnly = false) {
  return [
    'w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition-colors',
    'bg-black/[0.03] dark:bg-white/[0.04] text-[#231A14] dark:text-[#F7F4EF]',
    'focus:border-[#9E7246] focus:ring-2 focus:ring-[#9E7246]/20',
    hasError ? 'border-rose-400 dark:border-rose-500' : 'border-black/[0.08] dark:border-white/[0.1]',
    readOnly ? 'opacity-70 cursor-not-allowed' : '',
  ].join(' ');
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-xs font-semibold text-[#524438] dark:text-[#D4BA9E]">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="block mt-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
          {error}
        </span>
      ) : hint ? (
        <span className="block mt-1.5 text-[11px] text-[#8F7F70] dark:text-[#9E8E80]">{hint}</span>
      ) : null}
    </label>
  );
}

export default function Profile() {
  const { user, updateDisplayName } = useAuth();
  const { showToast } = useToast();

  // Personal information
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.displayName ?? '');
  const [nameError, setNameError] = useState('');
  const [phone, setPhone] = useState('');
  const [savedPhone, setSavedPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [savingPassword, setSavingPassword] = useState(false);

  // The phone number lives on the admin's document in Firestore, so load it once.
  useEffect(() => {
    if (!db || !user) return;
    getDoc(doc(db, 'admins', user.uid))
      .then((snap) => {
        const value = snap.data()?.phone ?? '';
        setPhone(value);
        setSavedPhone(value);
      })
      .catch(() => undefined);
  }, [user?.uid]);

  if (!user) return null;

  const startEditing = () => {
    setName(user.displayName);
    setNameError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setName(user.displayName);
    setPhone(savedPhone);
    setNameError('');
    setEditing(false);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Full name is required');
      return;
    }
    const trimmedPhone = phone.trim();
    if (trimmed === user.displayName && trimmedPhone === savedPhone) {
      setEditing(false);
      return;
    }

    setNameError('');
    setSavingProfile(true);
    try {
      if (!db || !auth?.currentUser) throw new Error('You are not connected to Firebase.');
      await updateDoc(doc(db, 'admins', user.uid), { name: trimmed, phone: trimmedPhone });
      setSavedPhone(trimmedPhone);
      await updateProfile(auth.currentUser, { displayName: trimmed }).catch(() => undefined);
      updateDisplayName(trimmed);
      setEditing(false);
      showToast({ type: 'success', message: 'Profile updated' });
    } catch (cause) {
      showToast({
        type: 'error',
        message: cause instanceof Error ? cause.message : "Couldn't update profile. Try again.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();

    const errors: PasswordErrors = {};
    if (!currentPassword) errors.current = 'Enter your current password';
    if (newPassword.length < 8) errors.next = 'Use at least 8 characters';
    else if (!/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      errors.next = 'Include a number and a special character';
    }
    else if (newPassword === currentPassword) errors.next = 'New password must be different';
    if (confirmPassword !== newPassword) errors.confirm = 'Passwords do not match';
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingPassword(true);
    try {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser || !firebaseUser.email) throw new Error('You are not connected to Firebase.');

      // Firebase asks for the current password again before changing it
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({ type: 'success', message: 'Password updated' });
    } catch (cause) {
      const code =
        typeof cause === 'object' && cause !== null && 'code' in cause
          ? String((cause as { code: unknown }).code)
          : '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordErrors({ current: 'Current password is incorrect' });
      } else if (code === 'auth/weak-password') {
        setPasswordErrors({ next: 'That password is too weak' });
      } else if (code === 'auth/too-many-requests') {
        showToast({ type: 'error', message: 'Too many attempts. Please try again later.' });
      } else {
        showToast({
          type: 'error',
          message: cause instanceof Error ? cause.message : "Couldn't update password. Try again.",
        });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#8F7F70] dark:text-[#9E8E80]">
          <span>Account</span>
          <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
          <span>Profile</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1">
          Account Settings
        </h1>
        <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
          Manage your personal account details and security settings.
        </p>
      </div>

      {/* Profile summary */}
      <div className="glass-panel p-6 rounded-3xl shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#845A32] to-[#B58752] flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm">
          {getInitials(user.displayName)}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#231A14] dark:text-[#F7F4EF] truncate">{user.displayName}</h2>
          <p className="text-xs text-[#7A6C60] dark:text-[#A69788] truncate">{user.email}</p>
          <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-lg bg-[#F3EDE4] dark:bg-[#281F19] text-[11px] font-semibold text-[#845A32] dark:text-[#D6A670]">
            <ShieldCheck className="w-3 h-3" />
            {user.role}
          </span>
        </div>
      </div>

      {/* Personal information */}
      <form onSubmit={handleSaveProfile} className="glass-panel p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-bold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
            <span>Personal Information</span>
          </h2>
          {!editing && (
            <LoadingButton
              variant="secondary"
              onClick={startEditing}
              className="px-3.5! py-1.5!"
              icon={<Pencil className="w-3.5 h-3.5" />}
            >
              Edit profile
            </LoadingButton>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full name" error={nameError}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly={!editing}
              disabled={savingProfile}
              className={inputClass(Boolean(nameError), !editing)}
            />
          </Field>
          <Field label="Role">
            <input type="text" value={user.role} readOnly className={inputClass(false, true)} />
          </Field>
          <Field label="Email address" hint="Your email is your login and can't be changed here.">
            <input type="email" value={user.email} readOnly className={inputClass(false, true)} />
          </Field>
          <Field label="Phone number" hint="Include your country code when adding a phone number.">
            <input
              type="tel"
              value={phone}
              placeholder="+267 7xxxxxxx"
              onChange={(e) => setPhone(e.target.value)}
              readOnly={!editing}
              disabled={savingProfile}
              className={inputClass(false, !editing)}
            />
          </Field>
        </div>

        {editing && (
          <div className="flex justify-end gap-2 pt-2">
            <LoadingButton variant="secondary" onClick={cancelEditing} disabled={savingProfile}>
              Cancel
            </LoadingButton>
            <LoadingButton type="submit" loading={savingProfile} loadingText="Saving...">
              Save changes
            </LoadingButton>
          </div>
        )}
      </form>

      {/* Security */}
      <form onSubmit={handleChangePassword} className="glass-panel p-6 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-bold text-[#231A14] dark:text-[#F7F4EF] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670]" />
            <span>Security</span>
          </h2>
          <button
            type="button"
            onClick={() => setShowPasswords((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#845A32] dark:text-[#D6A670] cursor-pointer"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPasswords ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Field label="Current password" error={passwordErrors.current}>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              disabled={savingPassword}
              className={inputClass(Boolean(passwordErrors.current))}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="New password" error={passwordErrors.next} hint="Use at least 8 characters, including a number and a special character.">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={savingPassword}
                className={inputClass(Boolean(passwordErrors.next))}
              />
            </Field>
            <Field label="Confirm new password" error={passwordErrors.confirm}>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={savingPassword}
                className={inputClass(Boolean(passwordErrors.confirm))}
              />
            </Field>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <LoadingButton type="submit" loading={savingPassword} loadingText="Updating...">
            Change password
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Users,
  Search,
  Trash2,
  Mail,
  User as UserIcon,
  Star,
  EyeOff,
  Eye,
  PauseCircle,
  PlayCircle,
  MessageSquare,
} from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../components/ui/Toast';
import type { Customer, Guesthouse, Review } from '../types';

type Tab = 'customers' | 'reviews';
type ReviewFilter = 'all' | 'low' | 'hidden';

// One pending action at a time, shown in the confirm modal
type Pending =
  | { kind: 'suspend' | 'reactivate' | 'delete-customer'; customer: Customer }
  | { kind: 'hide' | 'restore' | 'delete-review'; review: Review };

const badge = 'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-lg';

function Stars({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= score ? 'fill-[#9E7246] text-[#9E7246]' : 'text-black/15 dark:text-white/15'}`}
        />
      ))}
    </span>
  );
}

export default function UserManagement() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('customers');
  const [users, setUsers] = useState<Customer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [guesthouses, setGuesthouses] = useState<Guesthouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [pending, setPending] = useState<Pending | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    Promise.all([api.getCustomers(), api.getReviews(), api.getGuesthouses()])
      .then(([customers, ratings, listings]) => {
        setUsers(customers);
        setReviews(ratings);
        setGuesthouses(listings);
        setError('');
      })
      .catch((err) => {
        // permission-denied here means the updated firestore.rules have not been deployed yet
        setError(err instanceof Error ? err.message : 'Failed to load customers.');
      })
      .finally(() => setLoading(false));
  }, []);

  const guesthouseName = useMemo(() => {
    const names = new Map(guesthouses.map((g) => [g._id, g.name]));
    return (id: string) => names.get(id) ?? 'Deleted guesthouse';
  }, [guesthouses]);

  const reviewCount = useMemo(() => {
    const counts = new Map<string, number>();
    reviews.forEach((r) => counts.set(r.customerId, (counts.get(r.customerId) ?? 0) + 1));
    return counts;
  }, [reviews]);

  const q = searchQuery.toLowerCase().trim();

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === 'low' && (r.score > 2 || r.isHidden)) return false;
    if (reviewFilter === 'hidden' && !r.isHidden) return false;
    if (!q) return true;
    return (
      r.customerName.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q) ||
      guesthouseName(r.guesthouseId).toLowerCase().includes(q)
    );
  });

  const lowCount = reviews.filter((r) => r.score <= 2 && !r.isHidden).length;
  const hiddenCount = reviews.filter((r) => r.isHidden).length;

  const updateCustomer = (id: string, changes: Partial<Customer>) =>
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...changes } : u)));

  const updateReview = (id: string, changes: Partial<Review>) =>
    setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, ...changes } : r)));

  const setSuspended = async (customer: Customer, suspend: boolean) => {
    await api.setCustomerSuspended(customer._id, suspend);
    updateCustomer(customer._id, { isSuspended: suspend });
  };

  const setHidden = async (review: Review, hidden: boolean) => {
    await api.setReviewHidden(review, hidden);
    updateReview(review._id, { isHidden: hidden });
  };

  const confirmPending = async () => {
    if (!pending || working) return;
    setWorking(true);
    try {
      switch (pending.kind) {
        case 'suspend': {
          const customer = pending.customer;
          await setSuspended(customer, true);
          showToast({
            type: 'info',
            message: `${customer.name || 'Customer'} suspended`,
            actionLabel: 'Undo',
            onAction: () => {
              setSuspended(customer, false).catch(() =>
                showToast({ type: 'error', message: "Couldn't undo. Try reactivating instead." }));
            },
          });
          break;
        }
        case 'reactivate':
          await setSuspended(pending.customer, false);
          showToast({ type: 'success', message: `${pending.customer.name || 'Customer'} reactivated` });
          break;
        case 'delete-customer': {
          const id = pending.customer._id;
          await api.deleteCustomer(id);
          setUsers((prev) => prev.filter((u) => u._id !== id));
          showToast({ type: 'success', message: 'Customer removed' });
          break;
        }
        case 'hide': {
          const review = pending.review;
          await setHidden(review, true);
          showToast({
            type: 'info',
            message: 'Review hidden',
            actionLabel: 'Undo',
            onAction: () => {
              setHidden(review, false).catch(() =>
                showToast({ type: 'error', message: "Couldn't undo. Try restoring instead." }));
            },
          });
          break;
        }
        case 'restore':
          await setHidden(pending.review, false);
          showToast({ type: 'success', message: 'Review restored' });
          break;
        case 'delete-review': {
          const review = pending.review;
          await api.deleteReview(review);
          setReviews((prev) => prev.filter((r) => r._id !== review._id));
          showToast({ type: 'success', message: 'Review deleted' });
          break;
        }
      }
      setPending(null);
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Something went wrong. Try again.' });
    } finally {
      setWorking(false);
    }
  };

  // Wording for the confirm modal
  let modal: {
    title: string;
    message: ReactNode;
    confirm: string;
    loading: string;
    variant: 'accent' | 'danger';
    icon?: ReactNode;
  } | null = null;

  if (pending) {
    switch (pending.kind) {
      case 'suspend':
        modal = {
          title: 'Suspend customer?',
          message: <><b>{pending.customer.name || pending.customer.email}</b> will still be able to browse, but can't rate or review until you reactivate them.</>,
          confirm: 'Suspend', loading: 'Suspending...', variant: 'accent',
        };
        break;
      case 'reactivate':
        modal = {
          title: 'Reactivate customer?',
          message: <><b>{pending.customer.name || pending.customer.email}</b> will be able to post reviews again.</>,
          confirm: 'Reactivate', loading: 'Reactivating...', variant: 'accent', icon: <PlayCircle className="w-5 h-5" />,
        };
        break;
      case 'delete-customer':
        modal = {
          title: 'Remove customer?',
          message: 'This removes their profile from the database. Their login has to be removed separately under Authentication in the Firebase console.',
          confirm: 'Remove', loading: 'Removing...', variant: 'danger', icon: <Trash2 className="w-5 h-5" />,
        };
        break;
      case 'hide':
        modal = {
          title: 'Hide review?',
          message: 'It disappears from the mobile app and stops counting towards the guesthouse rating. You can restore it later.',
          confirm: 'Hide review', loading: 'Hiding...', variant: 'accent', icon: <EyeOff className="w-5 h-5" />,
        };
        break;
      case 'restore':
        modal = {
          title: 'Restore review?',
          message: 'It shows on the mobile app again and counts towards the rating.',
          confirm: 'Restore', loading: 'Restoring...', variant: 'accent', icon: <Eye className="w-5 h-5" />,
        };
        break;
      case 'delete-review':
        modal = {
          title: 'Delete review?',
          message: "This permanently removes the review and updates the guesthouse rating. This action can't be undone.",
          confirm: 'Delete', loading: 'Deleting...', variant: 'danger', icon: <Trash2 className="w-5 h-5" />,
        };
        break;
    }
  }

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
      active
        ? 'bg-white dark:bg-[#251E1A] text-[#231A14] dark:text-[#F7F4EF] shadow-xs'
        : 'text-[#7A6C60] dark:text-[#A69788] hover:text-[#231A14] dark:hover:text-[#F7F4EF]'
    }`;

  const iconButton = 'p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50';

  const emptyRow = (cols: number, title: string, text: string) => (
    <tr>
      <td colSpan={cols} className="py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-[#9E7246] flex items-center justify-center mx-auto mb-3">
          {tab === 'customers' ? <Users className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </div>
        <p className="font-bold text-sm text-[#231A14] dark:text-[#F7F4EF]">{title}</p>
        <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-1 max-w-sm mx-auto">{text}</p>
      </td>
    </tr>
  );

  // Placeholder rows with the same height as real ones while data loads
  const loadingRows = (cols: number) =>
    [1, 2, 3, 4].map((i) => (
      <tr key={i} className="animate-pulse">
        <td colSpan={cols} className="py-3.5 px-4">
          <div className="h-8 rounded-xl bg-black/[0.05] dark:bg-white/[0.06]" />
        </td>
      </tr>
    ));

  const headRow = 'border-b border-black/[0.05] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-[#8F7F70] dark:text-[#9E8E80] font-semibold uppercase tracking-wider text-[10px]';
  const pillGroup = 'flex items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] rounded-xl';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8F7F70] dark:text-[#9E8E80]">
            <span>Directory</span>
            <span aria-hidden="true" className="text-black/20 dark:text-white/20">·</span>
            <span>Trust & Safety</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#231A14] dark:text-[#F7F4EF] mt-1">
            Customers & Reviews
          </h1>
          <p className="text-xs text-[#7A6C60] dark:text-[#A69788] mt-0.5">
            Suspend customers who break the rules and moderate what guests post on the mobile app.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#9E7246] dark:text-[#D6A670] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={tab === 'customers' ? 'Search customers...' : 'Search reviews...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-xs bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#231A14] dark:text-[#F7F4EF] focus:bg-white dark:focus:bg-[#251E1A] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Tabs + review filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className={pillGroup}>
          <button onClick={() => setTab('customers')} className={tabClass(tab === 'customers')}>
            <Users className="w-3.5 h-3.5" /> Customers ({users.length})
          </button>
          <button onClick={() => setTab('reviews')} className={tabClass(tab === 'reviews')}>
            <MessageSquare className="w-3.5 h-3.5" /> Reviews ({reviews.length})
          </button>
        </div>

        {tab === 'reviews' && (
          <div className={pillGroup}>
            <button onClick={() => setReviewFilter('all')} className={tabClass(reviewFilter === 'all')}>All</button>
            <button onClick={() => setReviewFilter('low')} className={tabClass(reviewFilter === 'low')}>
              Needs a look ({lowCount})
            </button>
            <button onClick={() => setReviewFilter('hidden')} className={tabClass(reviewFilter === 'hidden')}>
              Hidden ({hiddenCount})
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-2xl text-xs" role="alert">
          {error}
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {tab === 'customers' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={headRow}>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-center">Reviews</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {loading
                  ? loadingRows(6)
                  : filteredUsers.length === 0
                    ? emptyRow(6, 'No customers found', 'When people sign up on the mobile app, they will appear here.')
                    : filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors ${user.isSuspended ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}`}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] text-[#372A22] dark:text-[#EAE2D8] border border-black/[0.06] dark:border-white/[0.08] font-bold flex items-center justify-center text-xs">
                              {user.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-semibold text-[#231A14] dark:text-[#F7F4EF]">
                                {user.name || 'Anonymous User'}
                              </p>
                              <p className="text-[10px] text-[#8F7F70] dark:text-[#9E8E80] font-mono">
                                ID: {user._id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-[#524438] dark:text-[#D4BA9E] font-mono">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#8F7F70]" />
                            {user.email || 'No email provided'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-[#524438] dark:text-[#D4BA9E]">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono tabular-nums text-[#231A14] dark:text-[#F7F4EF]">
                          {reviewCount.get(user._id) ?? 0}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {user.isSuspended ? (
                            <span className={`${badge} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400`}>
                              <PauseCircle className="w-3 h-3" /> Suspended
                            </span>
                          ) : (
                            <span className={`${badge} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400`}>
                              <PlayCircle className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setPending({ kind: user.isSuspended ? 'reactivate' : 'suspend', customer: user })}
                            className={`${iconButton} ${user.isSuspended
                              ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'}`}
                            title={user.isSuspended ? 'Reactivate customer' : 'Suspend customer'}
                          >
                            {user.isSuspended ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setPending({ kind: 'delete-customer', customer: user })}
                            className={`${iconButton} text-[#8F7F70] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30`}
                            title="Remove customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={headRow}>
                  <th className="py-3 px-4">Review</th>
                  <th className="py-3 px-4">Guesthouse</th>
                  <th className="py-3 px-4">Posted</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {loading
                  ? loadingRows(5)
                  : filteredReviews.length === 0
                    ? emptyRow(5, 'No reviews here', 'Reviews posted on the mobile app will show up here.')
                    : filteredReviews.map((review) => (
                      <tr
                        key={review._id}
                        className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors align-top ${review.isHidden ? 'opacity-60' : ''}`}
                      >
                        <td className="py-3.5 px-4 max-w-md">
                          <div className="flex items-center gap-2">
                            <Stars score={review.score} />
                            <span className="font-semibold text-[#231A14] dark:text-[#F7F4EF]">{review.customerName}</span>
                          </div>
                          <p className="mt-1 text-[#524438] dark:text-[#D4BA9E] leading-relaxed">
                            {review.comment || <span className="italic text-[#8F7F70]">No comment, rating only</span>}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-[#524438] dark:text-[#D4BA9E]">
                          {guesthouseName(review.guesthouseId)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-[#524438] dark:text-[#D4BA9E]">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {review.isHidden ? (
                            <span className={`${badge} bg-black/[0.05] dark:bg-white/[0.08] text-[#524438] dark:text-[#D4BA9E]`}>
                              <EyeOff className="w-3 h-3" /> Hidden
                            </span>
                          ) : (
                            <span className={`${badge} bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400`}>
                              <Eye className="w-3 h-3" /> Visible
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setPending({ kind: review.isHidden ? 'restore' : 'hide', review })}
                            className={`${iconButton} text-[#7A6C60] hover:text-[#231A14] dark:text-[#A69788] dark:hover:text-[#F7F4EF] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]`}
                            title={review.isHidden ? 'Restore review' : 'Hide review'}
                          >
                            {review.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setPending({ kind: 'delete-review', review })}
                            className={`${iconButton} text-[#8F7F70] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30`}
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmModal
        open={modal !== null}
        title={modal?.title ?? ''}
        message={modal?.message}
        confirmLabel={modal?.confirm ?? ''}
        loadingLabel={modal?.loading}
        confirmVariant={modal?.variant}
        icon={modal?.icon}
        loading={working}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

// Field-level profile completion across the three profile sources:
//  • account basics   (Supabase members + Prisma user)
//  • business profile (localStorage: fe_my_biz_profile)
//  • owner profile    (localStorage: fe_my_owner_profile)

export type CompletionBasics = {
  name?: string;
  email?: string;
  industry?: string;
  stage?: string;
  avatarUrl?: string | null;
};

export type CompletionItem = { label: string; done: boolean };

export type CompletionResult = {
  percent: number;      // 0–100, rounded
  done: number;         // fields completed
  total: number;        // total fields counted
  remaining: number;    // total - done
  items: CompletionItem[];
};

function has(v?: string | null): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

export function computeProfileCompletion(basics: CompletionBasics, ignoreLocalStorage = false): CompletionResult {
  let biz: any = null;
  let owner: any = null;
  if (typeof window !== 'undefined' && !ignoreLocalStorage) {
    const userKey = basics.email ? basics.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : '';
    const bizKey = userKey ? `fe_my_biz_profile_${userKey}` : 'fe_my_biz_profile';
    const ownerKey = userKey ? `fe_my_owner_profile_${userKey}` : 'fe_my_owner_profile';

    try { biz = JSON.parse(localStorage.getItem(bizKey) || 'null'); } catch {}
    try { owner = JSON.parse(localStorage.getItem(ownerKey) || 'null'); } catch {}
  }

  const items: CompletionItem[] = [
    // Account basics
    { label: 'Add your full name',              done: has(basics.name) && basics.name !== 'Loading User' },
    { label: 'Confirm your email',              done: has(basics.email) },
    { label: 'Set your industry',               done: has(basics.industry) && basics.industry !== 'Member' },
    { label: 'Set your business stage',         done: has(basics.stage) && basics.stage !== 'N/A' },
    { label: 'Upload a profile photo',          done: has(basics.avatarUrl) },

    // Business profile
    { label: 'Create a business profile',       done: has(biz?.name) },
    { label: 'Describe your business',          done: has(biz?.description) },
    { label: 'Add your business website',       done: has(biz?.website) },
    { label: 'Say what your business needs',    done: has(biz?.lookingFor) },
    { label: 'Tag your business services',      done: Array.isArray(biz?.tags) && biz.tags.length > 0 },

    // Owner profile
    { label: 'Write your founder bio',          done: has(owner?.bio) },
    { label: 'Add your title or role',          done: has(owner?.title) },
    { label: 'Say what you’re looking to grow', done: has(owner?.lookingFor) },
    { label: 'Tag your founder profile',        done: Array.isArray(owner?.tags) && owner.tags.length > 0 },
  ];

  const total = items.length;
  const done = items.filter(i => i.done).length;
  const percent = Math.round((done / total) * 100);
  return { percent, done, total, remaining: total - done, items };
}

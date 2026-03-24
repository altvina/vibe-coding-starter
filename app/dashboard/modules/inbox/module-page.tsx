import { Inbox } from 'lucide-react';

export function InboxModulePage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-12">
        <div className="rounded-2xl border p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Inbox className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Inbox placeholder</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Email/inbox functionality is currently disabled. This nav icon remains as a
                placeholder while the replacement communication workflow is being finalized.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


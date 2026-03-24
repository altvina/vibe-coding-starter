export function ProjectsModulePage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-12">
        <div className="rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">Projects tool disabled</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            The internal projects implementation has been removed from active use while
            external project tooling is finalized.
          </p>
        </div>
      </div>
    </div>
  );
}


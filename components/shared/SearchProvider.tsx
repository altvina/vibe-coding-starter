'use client';

import type { Action } from '@shipixen/kbar';
import { KBarSearchProvider } from '@shipixen/pliny/search/KBar';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { searchLinks } from '@/data/config/searchLinks';

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const defaultActions = useMemo<Action[]>(
    () =>
      searchLinks.map((link) => ({
        id: link.id,
        name: link.name,
        keywords: link.keywords,
        section: link.section,
        perform: () => router.push(link.href),
      })),
    [router],
  );

  return (
    <KBarSearchProvider
      kbarConfig={{
        searchDocumentsPath: false,
        defaultActions,
      }}
    >
      {children}
    </KBarSearchProvider>
  );
};

export default SearchProvider;

import { genPageMetadata } from '@/app/seo';
import { AnalyticsModulePage } from '@/app/dashboard/modules/analytics/module-page';

export const metadata = genPageMetadata({
  title: 'Analytics',
  description: 'Analytics in the Altvina expert portal.',
});

export default function AnalyticsPage() {
  return <AnalyticsModulePage />;
}


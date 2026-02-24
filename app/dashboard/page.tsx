import { genPageMetadata } from '@/app/seo';
import { OverviewContent } from '@/app/dashboard/_components/overview-content';

export const metadata = genPageMetadata({
  title: 'Dashboard',
  description: 'Altvina expert portal dashboard.',
});

export default function DashboardPage() {
  return <OverviewContent />;
}

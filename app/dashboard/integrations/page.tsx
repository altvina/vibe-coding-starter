import { genPageMetadata } from '@/app/seo';
import { IntegrationsModulePage } from '@/app/dashboard/modules/integrations/module-page';

export const metadata = genPageMetadata({
  title: 'Launch Hub',
  description: 'Launch configured external collaboration tools.',
});

export default function IntegrationsPage() {
  return <IntegrationsModulePage />;
}

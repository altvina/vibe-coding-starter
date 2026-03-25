import { genPageMetadata } from '@/app/seo';
import { IntegrationsModulePage } from '@/app/dashboard/modules/integrations/module-page';

export const metadata = genPageMetadata({
  title: 'Apps',
  description: 'Connected apps, automations, and data sources.',
});

export default function AppsPage() {
  return <IntegrationsModulePage />;
}

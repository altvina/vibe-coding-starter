import { genPageMetadata } from '@/app/seo';
import { ClientsModulePage } from '@/app/dashboard/modules/clients/module-page';

export const metadata = genPageMetadata({
  title: 'Clients',
  description: 'Clients overview in the Altvina expert portal.',
});

export default function ClientsPage() {
  return <ClientsModulePage />;
}


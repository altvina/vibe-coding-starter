import { NewsletterAPI } from '@shipixen/pliny/newsletter';
import { siteConfig } from '@/data/config/site.settings';
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const NEWSLETTER_PROVIDERS = [
  'buttondown',
  'convertkit',
  'klaviyo',
  'mailchimp',
  'revue',
  'emailoctopus',
] as const;
type NewsletterProvider = (typeof NEWSLETTER_PROVIDERS)[number];

const provider = siteConfig.newsletter.provider;
const providerNormalized = typeof provider === 'string' ? provider.trim() : '';
const hasProvider = (NEWSLETTER_PROVIDERS as readonly string[]).includes(
  providerNormalized,
);

const disabledHandler = async () => {
  return NextResponse.json(
    { error: 'Newsletter is not configured.' },
    { status: 404 },
  );
};

const handler =
  hasProvider
    ? NewsletterAPI({ provider: providerNormalized as NewsletterProvider })
    : disabledHandler;

export { handler as GET, handler as POST };

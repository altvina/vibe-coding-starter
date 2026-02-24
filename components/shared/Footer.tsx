import {
  LandingFooter,
  LandingFooterColumn,
  LandingFooterLink,
} from '@/components/landing';
import Image from 'next/image';
import Link from 'next/link';
import { siteLogos } from '@/data/config/logos';

export const Footer = ({ className }: { className?: string }) => {
  return (
    <LandingFooter
      className={className}
      title="Mevolut"
      description="A simpler way to manage your money"
      withBackground
      withBackgroundGlow={false}
      variant="primary"
      backgroundGlowVariant="primary"
      withBackgroundGradient
      logoComponent={
        <div className="flex items-center gap-3 text-primary-900 dark:text-primary-100">
          <Image
            src={siteLogos.svg}
            alt="Mevolut logo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 invert dark:invert-0"
            unoptimized
          />
          {'Mevolut '}
        </div>
      }
    >
      <LandingFooterColumn title="Product">
        <LandingFooterLink href="/features">{'Features'}</LandingFooterLink>
        <LandingFooterLink href="/pricing">{'Pricing'}</LandingFooterLink>
        <LandingFooterLink href="/security">{'Security'}</LandingFooterLink>
        <LandingFooterLink href="/faq">{'FAQ'}</LandingFooterLink>
      </LandingFooterColumn>
      <LandingFooterColumn title="Company">
        <LandingFooterLink href="/about">{'About Us'}</LandingFooterLink>
        <LandingFooterLink href="/careers">{'Careers'}</LandingFooterLink>
        <LandingFooterLink href="/press">{'Press'}</LandingFooterLink>
      </LandingFooterColumn>
      <LandingFooterColumn title="Support">
        <LandingFooterLink href="/help">{'Help Center'}</LandingFooterLink>
        <LandingFooterLink href="/contact">{'Contact Us'}</LandingFooterLink>
        <LandingFooterLink href="/status">{'System Status'}</LandingFooterLink>
      </LandingFooterColumn>
      <LandingFooterColumn title="Legal">
        <LandingFooterLink href="/terms">
          {'Terms of Service'}
        </LandingFooterLink>
        <LandingFooterLink href="/privacy">
          {'Privacy Policy'}
        </LandingFooterLink>
        <LandingFooterLink href="/cookies">{'Cookie Policy'}</LandingFooterLink>
      </LandingFooterColumn>
    </LandingFooter>
  );
};

export default Footer;

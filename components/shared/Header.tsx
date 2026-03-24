import { LandingHeader, LandingHeaderMenuItem } from '@/components/landing';
import ThemeSwitch from '@/components/shared/ThemeSwitch';
import Image from 'next/image';
import { siteLogos } from '@/data/config/logos';

export const Header = ({ className }: { className?: string }) => {
  return (
    <LandingHeader
      className={className}
      fixed
      withBackground
      variant="primary"
      logoComponent={
        <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400">
          <Image
            src={siteLogos.svg}
            alt="Altvina logo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 invert dark:invert-0"
            unoptimized
          />
          <span className="font-bold text-lg">Altvina</span>
        </div>
      }
    >
      <LandingHeaderMenuItem type="button" href="/dashboard">
        Dashboard
      </LandingHeaderMenuItem>

      <ThemeSwitch />
    </LandingHeader>
  );
};

export default Header;

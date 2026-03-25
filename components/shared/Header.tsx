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
        <div className="flex items-center gap-3 text-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-[var(--elevation-soft)] ring-1 ring-border/90">
            <Image
              src={siteLogos.png}
              alt="Altvina logo"
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
              unoptimized
            />
          </div>
          <span className="text-lg font-bold tracking-tight">Altvina</span>
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

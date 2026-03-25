'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MenuIcon, OrbitIcon } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/shared/ui/sheet';
import clsx from 'clsx';

/**
 * A component that renders the navigation bar for the landing page.
 * It includes a logo and a list of navigation items. On mobile, it collapses into a burger + side sheet.
 */
export const LandingHeader = ({
  logoComponent,
  children,
  withBackground = false,
  variant = 'primary',
  fixed = false,
  className,
}: {
  logoComponent?: React.ReactNode;
  children: React.ReactNode;
  withBackground?: boolean;
  variant?: 'primary' | 'secondary';
  fixed?: boolean;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className={clsx(
        'flex items-center justify-between gap-4 px-3 py-3 w-full max-w-full container-narrow sm:gap-6 sm:p-4 lg:rounded-lg',
        fixed ? 'sticky top-4 left-auto right-auto z-50 backdrop-blur-xl' : '',
        fixed && !withBackground
          ? 'bg-card/90 shadow-[var(--elevation-soft)] ring-1 ring-border/90'
          : '',
        withBackground ? 'lg:m-4 justify-self-center' : '',
        withBackground && variant === 'primary'
          ? 'border border-border/90 bg-card/90 shadow-[var(--elevation-soft)]'
          : '',
        withBackground && variant === 'secondary'
          ? 'border border-border/90 bg-muted/80 shadow-[var(--elevation-soft)]'
          : '',
        className,
      )}
    >
      <div className="flex items-center">
        <Link href="/" className="text-2xl font-bold text-foreground">
          <div className="flex items-center gap-3 justify-between">
            {logoComponent || (
              <>
                <OrbitIcon className="h-8 w-8 text-primary-700" />

                <div className="hidden text-2xl font-semibold font-display sm:flex gap-2 h-full">
                  Page <span className="font-bold">UI</span>
                </div>
              </>
            )}
          </div>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6">{children}</div>

      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            {/* min-h/min-w 44px for accessible touch target */}
            <Button variant="outline" className="min-h-[44px] min-w-[44px] px-3">
              <MenuIcon className="h-6 w-6 mr-2" />
              <span className="hidden xs:inline">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col gap-4 mt-8">{children}</nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

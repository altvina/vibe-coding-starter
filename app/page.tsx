import Header from '@/components/shared/Header';
import Image from 'next/image';
import { Button } from '@/components/shared/ui/button';
import Link from 'next/link';
import { siteLogos } from '@/data/config/logos';
export default function Page() {
  return (
    <>
      <Header className="mb-4" />

      <div className="flex min-h-[calc(100vh-120px)] w-full flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <Image
              src={siteLogos.svg}
              alt="Altvina"
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 invert dark:invert-0"
              unoptimized
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-900 dark:text-primary-100 sm:text-3xl">
              Altvina Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Sign in or create an account to access your workspace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard">Sign in</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/dashboard">Sign up</Link>
            </Button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authentication and account pages will be added here. For now, both options take you to the dashboard.
          </p>
        </div>
      </div>
    </>
  );
}

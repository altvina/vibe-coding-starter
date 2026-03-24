import Link from '@/components/shared/Link';
import Header from '@/components/shared/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <div className="min-h-[500px] flex flex-col items-start justify-start md:mt-24 md:flex-row md:items-center md:justify-center md:space-x-6">
        <div className="space-x-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-6xl font-semibold leading-9 tracking-tight text-gray-900 dark:text-gray-100 md:border-r-2 md:px-6 md:text-8xl md:leading-14">
            404
          </h1>
        </div>
        <div className="max-w-md">
          <p className="mb-4 text-xl font-bold leading-normal md:text-2xl">
            Sorry, we couldn&apos;t find this page.
          </p>
          <p className="mb-8">
            Head back to the sign-in page or go to the dashboard.
          </p>
          <Link
            href="/"
            className="focus:shadow-outline-primary inline rounded-lg border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium leading-5 text-white shadow transition-colors duration-150 hover:bg-primary-700 focus:outline-none dark:hover:bg-primary-500"
          >
            Back to sign in
          </Link>
          <Link
            href="/dashboard"
            className="ml-3 inline rounded-lg border border-primary-600 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}

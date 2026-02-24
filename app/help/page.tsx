import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';

export default function Help() {
  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-between fancy-overlay">
      <Header />

      <div className="w-full flex flex-col items-center my-12">
        <section className="w-full p-6 container-narrow">
          <h1 className="text-4xl font-semibold leading-tight md:leading-tight max-w-xs sm:max-w-none md:text-6xl fancy-heading">
            Altvina Dashboard Help
          </h1>

          <p className="mt-6 md:text-xl">
            Welcome to the Altvina dashboard help. Here you can find guidance on
            signing in, using workspaces, and making the most of the dashboard.
          </p>

          <p className="mt-6 md:text-xl">
            Use the dashboard for projects, people, updates, and more. For
            account or billing help, visit the main Altvina website or contact
            your administrator.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}

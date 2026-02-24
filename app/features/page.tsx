import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';

export default function Features() {
  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-between fancy-overlay">
      <Header />

      <div className="w-full flex flex-col items-center my-12">
        <section className="w-full p-6 container-narrow">
          <h1 className="text-4xl font-semibold leading-tight md:leading-tight max-w-xs sm:max-w-none md:text-6xl fancy-heading">
            Altvina Dashboard Features
          </h1>

          <p className="mt-6 md:text-xl">
            The Altvina dashboard brings projects, people, updates, and workspace
            admin into one place. Use the same tools your team relies on—from
            one workspace.
          </p>

          <p className="mt-6 md:text-xl">
            Sign in to access your workspace, switch between modules, and
            collaborate. For more about Altvina, visit the main Altvina website.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}

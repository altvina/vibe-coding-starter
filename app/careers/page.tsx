import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';

export default function Careers() {
  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-between fancy-overlay">
      <Header />

      <div className="w-full flex flex-col items-center my-12">
        <section className="w-full p-6 container-narrow">
          <h1 className="text-4xl font-semibold leading-tight md:leading-tight max-w-xs sm:max-w-none md:text-6xl fancy-heading">
            Careers at Altvina
          </h1>

          <p className="mt-6 md:text-xl">
            Altvina is building tools that help teams work better together. We're
            looking for people who care about product, design, and engineering.
          </p>

          <p className="mt-6 md:text-xl">
            For open roles and company information, visit the main Altvina
            website. This app is the Altvina dashboard and CRM portal.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}

import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';

export default function Press() {
  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-between fancy-overlay">
      <Header />

      <div className="w-full flex flex-col items-center my-12">
        <section className="w-full p-6 container-narrow">
          <h1 className="text-4xl font-semibold leading-tight md:leading-tight max-w-xs sm:max-w-none md:text-6xl fancy-heading">
            Altvina in the News
          </h1>

          <p className="mt-6 md:text-xl">
            Altvina provides a dashboard and CRM for teams. Press and media
            inquiries: visit the main Altvina website for the latest news and
            contact details.
          </p>

          <p className="mt-6 md:text-xl">
            This app is the Altvina dashboard portal. For company news and
            press, please go to the main Altvina site. As we continue to
            grow, we're proud to be recognized for our innovative approach and
            dedication to customer success.
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}

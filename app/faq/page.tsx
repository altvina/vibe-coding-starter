import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';

export default function FAQ() {
  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-between fancy-overlay">
      <Header />

      <div className="w-full flex flex-col items-center my-12">
        <section className="w-full p-6 container-narrow">
          <h1 className="text-4xl font-semibold leading-tight md:leading-tight max-w-xs sm:max-w-none md:text-6xl fancy-heading">
            Frequently Asked Questions
          </h1>

          <p className="mt-6 md:text-xl">
            Common questions about the Altvina dashboard and access.
          </p>

          <p className="mt-6 md:text-xl">
            <strong>How do I get started?</strong> Sign in with your Altvina
            account. If you don't have access, request it from your admin or
            visit the main Altvina website.
          </p>

          <p className="mt-6 md:text-xl">
            <strong>Is my data secure?</strong> Yes. The dashboard uses secure
            sign-in and role-based access. We don't sell your information.
          </p>

          <p className="mt-6 md:text-xl">
            <strong>Can I use the dashboard on any device?</strong> Yes. The
            dashboard is responsive and works on phones, tablets, and desktops.
          </p>

          <p className="mt-6 md:text-xl">
            <strong>What can I do in the dashboard?</strong> You can use
            Projects, People, Updates, Inbox, and other modules your role allows.
            Admins can configure workspaces and permissions.
          </p>

          <p className="mt-6 md:text-xl">
            <strong>How do I contact support?</strong> For assistance, reach out
            through our support channels inside the app or via email. We're here
            to help!
          </p>
        </section>
      </div>

      <Footer />
    </div>
  );
}

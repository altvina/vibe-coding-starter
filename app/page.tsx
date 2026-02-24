import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { LandingPrimaryImageCtaSection } from '@/components/landing';
import { LandingSocialProof } from '@/components/landing';
import { LandingFeatureList } from '@/components/landing';
import { LandingProductSteps } from '@/components/landing';
import { LandingProductFeature } from '@/components/landing';
import { LandingTestimonialReadMoreWrapper } from '@/components/landing';
import { LandingTestimonialGrid } from '@/components/landing';
import { LandingSaleCtaSection } from '@/components/landing';
import { LandingFaqCollapsibleSection } from '@/components/landing';
import Image from 'next/image';
import { Button } from '@/components/shared/ui/button';
import Link from 'next/link';
import { CreditCard, Lock, Shield, TrendingUp, Users, Zap } from 'lucide-react';

export default function Page() {
  return (
    <>
      <Header className="mb-4" />

      <LandingPrimaryImageCtaSection
        title="Altvina Dashboard"
        description="Your workspace, projects, and CRM in one place. Sign in to access the Altvina dashboard and collaborate with your team."
        imageSrc="/static/images/1.jpg"
        imageAlt="Altvina Dashboard Preview"
        imagePosition="right"
        imageShadow="hard"
        textPosition="left"
        withBackground={false}
        variant="primary"
        minHeight={350}
      >
        <Button size="xl" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button size="xl" variant="outlinePrimary" asChild>
          <Link href="/pricing">Pricing</Link>
        </Button>
        <LandingSocialProof
          className="mt-6 w-full"
          avatarItems={[
            {
              imageSrc: '/static/images/people/1.webp',
              name: 'Sarah Johnson',
            },
            {
              imageSrc: '/static/images/people/2.webp',
              name: 'Michael Chen',
            },
            {
              imageSrc: '/static/images/people/3.webp',
              name: 'Emily Rodriguez',
            },
          ]}
          numberOfUsers={1100}
          suffixText="teams use Altvina"
        />
      </LandingPrimaryImageCtaSection>

      <div className="container-wide p-12 w-full flex flex-wrap items-center justify-center gap-6 dark:invert">
        <span className="w-full text-center text-sm opacity-70 dark:invert">
          As seen on
        </span>
        <Image
          src="/static/images/outlets/tech-crunch.svg"
          alt="TechCrunch"
          width={300}
          height={300}
          className="w-auto h-6"
        />
        <Image
          src="/static/images/outlets/the-new-york-times.svg"
          alt="The New York Times"
          width={300}
          height={300}
          className="w-auto h-8"
        />
        <Image
          src="/static/images/outlets/cnn.svg"
          alt="CNN"
          width={300}
          height={300}
          className="w-auto h-7"
        />
        <Image
          src="/static/images/outlets/the-verge.svg"
          alt="The Verge"
          width={300}
          height={300}
          className="w-auto h-7"
        />
      </div>

      <LandingFeatureList
        id="features"
        title="Everything you need in one workspace"
        description="Projects, people, updates, and collaboration—all in the Altvina dashboard."
        featureItems={[
          {
            title: 'Projects & tasks',
            description:
              'Organize work with projects and tasks. Track progress, assign owners, and keep everyone aligned with clear visibility and status.',
            icon: <TrendingUp className="w-8 h-8" />,
          },
          {
            title: 'People directory',
            description:
              'Central directory of your team with profiles, roles, and contact info. Find who you need and manage access across workspaces.',
            icon: <Users className="w-8 h-8" />,
          },
          {
            title: 'Updates & feed',
            description:
              'Post updates and follow team activity. Share to selected teams so the right people see the right information.',
            icon: <Zap className="w-8 h-8" />,
          },
          {
            title: 'Workspace admin',
            description:
              'Configure workspaces, modules, and permissions. Control what each role can see and do across the dashboard.',
            icon: <CreditCard className="w-8 h-8" />,
          },
          {
            title: 'Security & access',
            description:
              'Role-based access and secure sign-in. Your data and workspace settings are protected and auditable.',
            icon: <Shield className="w-8 h-8" />,
          },
          {
            title: 'Privacy & control',
            description:
              'You control visibility of profile and contact info. Clear indicators for what is shared and what stays private.',
            icon: <Lock className="w-8 h-8" />,
          },
        ]}
        withBackground
        withBackgroundGlow
        variant="primary"
        backgroundGlowVariant="primary"
      />

      <LandingProductSteps
        title="How it works"
        description="Get started with the Altvina dashboard in three steps."
        display="grid"
        withBackground={false}
        variant="primary"
      >
        <LandingProductFeature
          title="1. Sign in"
          description="Sign in with your Altvina account. If you don't have access yet, request it from your admin or visit the main Altvina website."
          imageSrc="/static/images/2.jpg"
          imageAlt="Sign in"
          imagePosition="center"
          imageShadow="soft"
          zoomOnHover
          minHeight={350}
          withBackground={false}
          withBackgroundGlow={false}
          variant="primary"
          backgroundGlowVariant="primary"
        />
        <LandingProductFeature
          title="2. Use your workspace"
          description="Switch to your workspace and use the sidebar to open Projects, People, Updates, Inbox, and other modules your role can access."
          imageSrc="/static/images/3.jpg"
          imageAlt="Workspace"
          imagePosition="center"
          imageShadow="soft"
          zoomOnHover
          minHeight={350}
          withBackground={false}
          withBackgroundGlow={false}
          variant="primary"
          backgroundGlowVariant="primary"
        />
        <LandingProductFeature
          title="3. Collaborate"
          description="Create projects, manage people, post updates, and work with your team—all from one dashboard."
          imageSrc="/static/images/4.jpg"
          imageAlt="Collaborate"
          imagePosition="center"
          imageShadow="soft"
          zoomOnHover
          minHeight={350}
          withBackground={false}
          withBackgroundGlow={false}
          variant="primary"
          backgroundGlowVariant="primary"
        />
      </LandingProductSteps>

      <LandingProductFeature
        id="security"
        title="Secure workspace"
        descriptionComponent={
          <>
            <p className="mb-6">
              The Altvina dashboard is built with security in mind. Your data and
              workspace access are protected with industry-standard measures.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Shield className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Secure sign-in: </strong>
                  Authentication and session handling keep your account safe
                </span>
              </li>
              <li className="flex items-start">
                <Shield className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Role-based access: </strong>
                  Permissions control what each user can see and do
                </span>
              </li>
              <li className="flex items-start">
                <Shield className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Privacy: </strong>
                  Profile and contact visibility are under your control
                </span>
              </li>
            </ul>
          </>
        }
        imageSrc="/static/images/5.jpg"
        imageAlt="Security"
        imagePosition="right"
        imageShadow="hard"
        textPosition="left"
        withBackground
        withBackgroundGlow
        variant="primary"
        backgroundGlowVariant="primary"
        imagePerspective="bottom"
        zoomOnHover
        minHeight={350}
      />

      <LandingTestimonialReadMoreWrapper>
        <LandingTestimonialGrid
          title="Built for teams"
          description="See how teams use the Altvina dashboard to stay aligned and get work done."
          testimonialItems={[
            {
              name: 'Sarah Anderson',
              text: 'The Altvina dashboard keeps our projects and people in one place. We finally have a single source of truth for who\'s doing what.',
              handle: '@sarahanderson',
              imageSrc: '/static/images/people/4.webp',
              url: '#',
              verified: true,
            },
            {
              name: 'John Bennett',
              text: 'Workspace admin and role-based access make it easy to onboard new people and control what they can see. No more sprawl.',
              handle: '@johnbennett',
              imageSrc: '/static/images/people/5.webp',
              url: '#',
              verified: true,
            },
            {
              name: 'Maria Garcia',
              text: 'Updates and the feed help our team stay in the loop without drowning in email. We post once and the right people see it.',
              handle: '@mariagarcia',
              imageSrc: '/static/images/people/6.webp',
              url: '#',
            },
            {
              name: 'David Kim',
              text: 'Simple and clear. The dashboard does what we need—projects, people, updates—without extra clutter.',
              handle: '@davidkim',
              imageSrc: '/static/images/people/7.webp',
              url: '#',
              verified: true,
            },
            {
              name: 'Emily Rodriguez',
              text: 'Having one place for our workspace, CRM-style people directory, and project status has made collaboration much smoother.',
              handle: '@emilyrodriguez',
              imageSrc: '/static/images/people/8.webp',
              url: '#',
            },
            {
              name: 'Michael Thompson',
              text: 'Security and access control are solid. We know who can see what, and our data stays where it should.',
              handle: '@michaelthompson',
              imageSrc: '/static/images/people/9.webp',
              url: '#',
              verified: true,
            },
            {
              name: 'Jessica Lee',
              text: 'The Altvina dashboard has become our daily hub. We start here every morning and everything we need is a click away.',
              handle: '@jessicalee',
              imageSrc: '/static/images/people/10.webp',
              url: '#',
            },
            {
              name: 'Robert Martinez',
              text: "Intuitive and powerful. It exceeded our expectations for a workspace and CRM in one.",
              handle: '@robertmartinez',
              imageSrc: '/static/images/people/11.webp',
              url: '#',
              verified: true,
            },
            {
              name: 'Amanda Chen',
              text: 'Quick to adopt. New team members get access, pick their workspace, and they\'re in. No long onboarding.',
              handle: '@amandachen',
              imageSrc: '/static/images/people/12.webp',
              url: '#',
            },
          ]}
          withBackground={false}
          variant="primary"
        />
      </LandingTestimonialReadMoreWrapper>

      <LandingSaleCtaSection
        id="pricing"
        title="Plans and pricing"
        description="See plans and pricing for the Altvina dashboard. Contact us for team and enterprise options."
        withBackground
        withBackgroundGlow
        variant="primary"
        backgroundGlowVariant="primary"
      >
        <Button size="xl" asChild>
          <Link href="/pricing">See Plans</Link>
        </Button>
      </LandingSaleCtaSection>

      <LandingFaqCollapsibleSection
        id="faq"
        title="Frequently Asked Questions"
        description="Common questions about the Altvina dashboard and access."
        faqItems={[
          {
            question: 'Who can access the Altvina dashboard?',
            answer:
              'Access is managed by your organization. If you have an Altvina account and your admin has granted you access to a workspace, you can sign in here. For new accounts or access requests, visit the main Altvina website or contact your admin.',
          },
          {
            question: 'How is my data secured?',
            answer:
              'The dashboard uses secure sign-in and role-based access. Your data and workspace settings are protected with industry-standard security practices. We do not sell your personal information.',
          },
          {
            question: 'What can I do in the dashboard?',
            answer:
              'You can use Projects, People, Updates, Inbox, Analytics, and other modules your role allows. Workspace admins can configure modules and permissions. Super admins have additional tools including module access and SQL console.',
          },
          {
            question: 'Can I use the dashboard on mobile?',
            answer:
              'Yes. The Altvina dashboard is responsive and works on smartphones, tablets, and desktops. Sign in from any supported browser to access your workspace.',
          },
          {
            question: 'How do I get help?',
            answer:
              'Use the Help link in the footer or header for support. For account or billing questions, visit the main Altvina website or contact your administrator.',
          },
          {
            question: 'Where is the main Altvina website?',
            answer:
              'Altvina’s main marketing and company site lives at a separate URL. This app is the dashboard and CRM portal. Your admin or Altvina can provide the main site link if needed.',
          },
        ]}
        withBackground={false}
        withBackgroundGlow={false}
        variant="primary"
        backgroundGlowVariant="primary"
      />

      <LandingSaleCtaSection
        title="Ready to get started?"
        description="Sign in to the Altvina dashboard or visit the main Altvina website for more information."
        withBackground
        withBackgroundGlow
        variant="primary"
        backgroundGlowVariant="primary"
      >
        <Button size="xl" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </LandingSaleCtaSection>

      <Footer className="mt-8" />
    </>
  );
}

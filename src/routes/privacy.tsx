import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy - SettleSide" },
      {
        name: "description",
        content: "How SettleSide collects, uses, and protects your personal information.",
      },
    ],
  }),
  component: PrivacyPage,
});

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between section-px py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal text-primary-foreground">
              <KeyRound className="h-4 w-4" />
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              SettleSide
            </span>
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Back to site
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl section-px py-14 md:py-20">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-10 space-y-8">{children}</div>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl section-px py-8 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <a href="mailto:hello@settleside.com" className="hover:text-foreground">
              hello@settleside.com
            </a>
          </div>
          <p className="mt-4">© {new Date().getFullYear()} SettleSide. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl text-foreground">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="20 July 2026">
      <p className="text-base leading-relaxed text-muted-foreground">
        This policy explains what personal information SettleSide collects when you use our
        relocation planning service, why we collect it, and what we do with it. We have tried to
        write it in plain language rather than legalese.
      </p>

      <Section heading="Who we are">
        <p>
          SettleSide is a relocation planning and concierge service operating in the United Arab
          Emirates. You can contact us at any time at{" "}
          <a className="text-teal hover:underline" href="mailto:hello@settleside.com">
            hello@settleside.com
          </a>
          .
        </p>
      </Section>

      <Section heading="What we collect">
        <p>
          When you submit a move request, we collect the information you give us, which may include:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your name, email address, and phone or WhatsApp number</li>
          <li>Where you are moving from and to, and your target move date</li>
          <li>
            Details about your household, whether you are moving with pets, and what you need help
            with
          </li>
          <li>
            Anything else you choose to tell us in the free-text description or message fields
          </li>
        </ul>
        <p>
          We also record basic technical information needed to operate the service securely, such as
          the IP address a request came from, which we use to prevent abuse and rate-limit our
          endpoints.
        </p>
        <p>
          We do not collect payment card details on this website, and we never ask for passport
          numbers, Emirates ID numbers, or banking credentials through the move request form.
        </p>
      </Section>

      <Section heading="Why we use it">
        <p>We use your information only to provide and improve the service:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>To generate your personalised move plan and match relevant providers</li>
          <li>To contact you about your move and send you your plan</li>
          <li>
            To request quotes on your behalf from service providers, when you ask us to coordinate
            your move
          </li>
          <li>To operate, secure, and improve the service</li>
        </ul>
        <p>
          We do not sell your personal information, and we do not use it for advertising or share it
          with third parties for their own marketing.
        </p>
      </Section>

      <Section heading="AI processing">
        <p>
          SettleSide uses artificial intelligence to turn your description of your move into a
          structured plan. The details you submit are sent to our AI provider (Anthropic) purely to
          generate that plan and an internal summary for our operations team. They are not used to
          train AI models.
        </p>
      </Section>

      <Section heading="Sharing with service providers">
        <p>
          When you ask us to arrange a service, we share only what that provider needs in order to
          quote or deliver it — for example your destination, move date, and the scope of work.
          Where a provider needs your direct contact details, we ask you first.
        </p>
        <p>
          Providers are independent businesses with their own privacy practices and terms. Once you
          engage a provider directly, their handling of your information is governed by their own
          policies.
        </p>
      </Section>

      <Section heading="Where your data is stored">
        <p>
          Your information is stored on managed cloud infrastructure (our database is hosted by
          Supabase and our application by Fly.io), including on servers located outside the UAE.
          Access is restricted to SettleSide personnel who need it to serve you.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <p>
          We keep move requests for as long as needed to serve you and to keep proper business
          records. If you would like your information deleted, email us and we will remove it,
          except where we are required to retain something by law.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can ask us to access, correct, or delete the personal information we hold about you,
          and you can ask us to stop contacting you at any time. Email{" "}
          <a className="text-teal hover:underline" href="mailto:hello@settleside.com">
            hello@settleside.com
          </a>{" "}
          and we will respond as promptly as we can.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          SettleSide is intended for adults arranging their own relocation. We do not knowingly
          collect information from children.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          We may update this policy as the service develops. The date at the top of this page shows
          when it was last revised.
        </p>
      </Section>
    </LegalShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { LegalShell, Section } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service - SettleSide" },
      {
        name: "description",
        content: "The terms that apply when you use SettleSide's relocation planning service.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="20 July 2026">
      <p className="text-base leading-relaxed text-muted-foreground">
        These terms apply when you use SettleSide. By submitting a move request you agree to them.
        Please read the section on what we are and are not responsible for, as it matters.
      </p>

      <Section heading="What SettleSide does">
        <p>
          SettleSide is a relocation planning and concierge service. We generate a personalised move
          plan from the details you give us, suggest relevant service providers, and — where you ask
          us to — collect quotes, make bookings, and coordinate your move on your behalf.
        </p>
      </Section>

      <Section heading="What SettleSide is not">
        <p>
          We are not a moving company, real estate broker, telecom operator, insurer, veterinary
          clinic, airline, customs broker, immigration agent, or legal advisor. We do not perform
          the underlying services ourselves. Every service is delivered by an independent provider
          under its own terms, pricing, and licensing.
        </p>
      </Section>

      <Section heading="Your move plan is guidance, not advice">
        <p>
          Move plans are generated automatically from what you tell us and are intended as practical
          guidance. Timelines, requirements, and costs vary by nationality, employer, landlord,
          building, and current government rules, and they change over time.
        </p>
        <p>
          Please verify anything consequential — visa and residency requirements, pet import rules,
          tenancy registration, insurance cover — with the relevant authority or a qualified
          professional. Nothing on this site is legal, immigration, financial, tax, or veterinary
          advice.
        </p>
      </Section>

      <Section heading="Providers, quotes, and prices">
        <p>
          Provider listings, availability, lead times, and prices shown on SettleSide are indicative
          and may change. A price is only firm once the provider confirms it to you in a quote.
          Contracts for the actual services are between you and the provider.
        </p>
        <p>
          We take reasonable care in selecting the providers we suggest, but we cannot guarantee
          their work, timekeeping, or conduct. If something goes wrong with a service, we will help
          you resolve it with the provider, but the provider remains responsible for its own work.
        </p>
      </Section>

      <Section heading="Fees">
        <p>
          Generating a move plan is free. If you ask SettleSide to coordinate your move, we will
          agree the fee with you in writing in advance, before any work begins. We may also receive
          a referral fee or commission from providers; where that is the case, it does not change
          the price you pay, and it does not affect our obligation to recommend what genuinely suits
          your move.
        </p>
      </Section>

      <Section heading="Using the service properly">
        <p>
          Please give us accurate information — the quality of your plan depends on it. Do not use
          the service to submit false requests, to abuse our systems or endpoints, or on behalf of
          someone who has not agreed to it. We may rate-limit, suspend, or decline service where we
          see misuse.
        </p>
      </Section>

      <Section heading="Availability">
        <p>
          We aim to keep SettleSide available and accurate, but we provide the service on an
          as-available basis and may change or interrupt it. Coverage, provider depth, and features
          vary by destination and will grow over time.
        </p>
      </Section>

      <Section heading="Liability">
        <p>
          To the extent permitted by law, SettleSide is not liable for loss or damage arising from
          services performed by independent providers, from decisions you make based on a generated
          plan, or from delays and requirements outside our control. Nothing in these terms limits
          liability that cannot lawfully be limited.
        </p>
      </Section>

      <Section heading="Privacy">
        <p>
          Our{" "}
          <a className="text-teal hover:underline" href="/privacy">
            Privacy Policy
          </a>{" "}
          explains what we collect and how we use it, and forms part of these terms.
        </p>
      </Section>

      <Section heading="Governing law">
        <p>
          These terms are governed by the laws of the United Arab Emirates, and the courts of Abu
          Dhabi have jurisdiction over any dispute.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about these terms? Email{" "}
          <a className="text-teal hover:underline" href="mailto:hello@settleside.com">
            hello@settleside.com
          </a>
          .
        </p>
      </Section>
    </LegalShell>
  );
}

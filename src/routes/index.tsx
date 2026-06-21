import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Menu,
  X,
  KeyRound,
  ClipboardCheck,
  Sparkles,
  Wifi,
  Sofa,
  Wrench,
  PawPrint,
  ShieldCheck,
  CalendarDays,
  MapPin,
  Users,
  PlaneLanding,
  Home,
  CheckCircle2,
  ArrowRight,
  Compass,
  ListChecks,
  Stethoscope,
  FileText,
  Scale,
  Check,
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SettleSide — Settle into Abu Dhabi with less stress" },
      {
        name: "description",
        content:
          "SettleSide helps busy expats coordinate apartment move-in setup and pet relocation readiness in Abu Dhabi. Calm, practical, on-the-ground support.",
      },
      { property: "og:title", content: "SettleSide — Settle into Abu Dhabi with less stress" },
      {
        property: "og:description",
        content: "Move-in setup and pet relocation readiness for Abu Dhabi expats.",
      },
    ],
  }),
  component: LandingPage,
});

/* ---------- Small primitives ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-teal hairline">
      <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
      {children}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <SectionLabel>{eyebrow}</SectionLabel>
      <h2 className="mt-5 text-3xl text-foreground sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
        {title}
      </h2>
      {body && <p className="mt-4 text-base text-muted-foreground sm:text-lg">{body}</p>}
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl bg-card p-6 shadow-soft hairline transition-shadow hover:shadow-card sm:p-7 " +
        className
      }
    >
      {children}
    </div>
  );
}

function IconBubble({
  children,
  tone = "teal",
}: {
  children: React.ReactNode;
  tone?: "teal" | "terracotta" | "sage" | "navy";
}) {
  const tones: Record<string, string> = {
    teal: "bg-[oklch(0.94_0.025_200)] text-teal",
    terracotta: "bg-terracotta-soft text-terracotta",
    sage: "bg-[oklch(0.93_0.03_150)] text-[oklch(0.42_0.05_155)]",
    navy: "bg-[oklch(0.93_0.02_240)] text-navy",
  };
  return (
    <div
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

/* ---------- Nav ---------- */

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#how", label: "How it works" },
  { href: "#packages", label: "Packages" },
  { href: "#pet", label: "Pet readiness" },
  { href: "#faq", label: "FAQ" },
];

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between section-px py-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal text-primary-foreground">
            <KeyRound className="h-4 w-4" />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
            SettleSide
          </span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <Button asChild className="rounded-full bg-teal px-5 text-primary-foreground hover:bg-teal/90">
            <a href="#inquiry">Plan my move-in</a>
          </Button>
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-lg hairline md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="section-px flex flex-col gap-1 py-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-sand"
              >
                {l.label}
              </a>
            ))}
            <Button
              asChild
              className="mt-2 w-full rounded-full bg-teal text-primary-foreground hover:bg-teal/90"
            >
              <a href="#inquiry" onClick={() => setOpen(false)}>
                Plan my move-in
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, oklch(0.94 0.04 200 / 0.6), transparent 60%), radial-gradient(50% 40% at 0% 30%, oklch(0.95 0.04 50 / 0.55), transparent 60%)",
        }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 section-px py-16 md:grid-cols-[1.05fr_1fr] md:py-24 lg:py-28">
        <div>
          <SectionLabel>Abu Dhabi · Concierge move-in support</SectionLabel>
          <h1 className="mt-6 text-4xl text-foreground sm:text-5xl md:text-[3.75rem] md:leading-[1.02]">
            Settle into Abu Dhabi
            <span className="text-teal"> with less stress.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            SettleSide helps busy expats coordinate move-in setup, apartment handover
            tasks, home essentials, and pet relocation readiness — before and after arrival.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-teal px-6 text-primary-foreground hover:bg-teal/90"
            >
              <a href="#inquiry">
                Plan my move-in
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-border bg-background hover:bg-sand"
            >
              <a href="#services">See services</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Apartment setup · Vendor coordination · Pet move readiness · Abu Dhabi
          </p>
        </div>

        {/* Hero visual: stacked cards */}
        <div className="relative">
          <div className="relative mx-auto grid max-w-md gap-4">
            {/* Top: checklist */}
            <Card className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-teal" />
                  Abu Dhabi · Al Reem
                </div>
                <span className="rounded-full bg-sand px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-teal">
                  Handover
                </span>
              </div>
              <h3 className="mt-3 font-serif text-lg text-foreground">Move-in checklist</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  ["Apartment handover photos", true],
                  ["Deep cleaning scheduled", true],
                  ["Curtains measured", false],
                  ["Internet activation", false],
                ].map(([label, done]) => (
                  <li key={label as string} className="flex items-center gap-2.5">
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full ${
                        done
                          ? "bg-teal text-primary-foreground"
                          : "border border-border bg-background"
                      }`}
                    >
                      {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                    </span>
                    <span
                      className={
                        done
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }
                    >
                      {label as string}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-deep">
                  <div className="h-full w-[55%] rounded-full bg-teal" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">55%</span>
              </div>
            </Card>

            {/* Middle two columns */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-5">
                <IconBubble tone="terracotta">
                  <Sofa className="h-5 w-5" />
                </IconBubble>
                <h4 className="mt-3 font-serif text-base text-foreground">Home essentials</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mattress · Curtains · Basics
                </p>
                <div className="mt-3 flex -space-x-1.5">
                  <div className="h-6 w-6 rounded-md bg-terracotta-soft hairline" />
                  <div className="h-6 w-6 rounded-md bg-sand-deep hairline" />
                  <div className="h-6 w-6 rounded-md bg-[oklch(0.93_0.03_150)] hairline" />
                </div>
              </Card>
              <Card className="p-5">
                <IconBubble tone="sage">
                  <PawPrint className="h-5 w-5" />
                </IconBubble>
                <h4 className="mt-3 font-serif text-base text-foreground">Pet readiness</h4>
                <p className="mt-1 text-xs text-muted-foreground">Timeline · Documents</p>
                <div className="mt-3 text-xs font-medium text-[oklch(0.42_0.05_155)]">
                  4 of 7 ready
                </div>
              </Card>
            </div>

            {/* Bottom: timeline */}
            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-teal" />
                First-week setup
              </div>
              <div className="mt-3 flex items-center gap-2">
                {[
                  { d: "T-14", label: "Plan", done: true },
                  { d: "T-3", label: "Handover", done: true },
                  { d: "Day 1", label: "Move-in", done: false },
                  { d: "Day 7", label: "Settled", done: false },
                ].map((s, i) => (
                  <div key={s.d} className="flex flex-1 items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold ${
                          s.done
                            ? "bg-teal text-primary-foreground"
                            : "bg-sand text-muted-foreground hairline"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="mt-1 text-[10px] font-medium text-foreground">
                        {s.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{s.d}</span>
                    </div>
                    {i < 3 && (
                      <div
                        className={`h-px flex-1 ${
                          s.done ? "bg-teal/40" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Problem ---------- */

const PROBLEMS = [
  {
    icon: ListChecks,
    title: "Too many moving parts",
    body: "Vendors, deliveries, building rules, utilities, and setup tasks quickly become hard to track.",
  },
  {
    icon: ShieldCheck,
    title: "Hard to know who to trust",
    body: "New arrivals often rely on random recommendations and rushed decisions.",
  },
  {
    icon: PawPrint,
    title: "Pets make timing critical",
    body: "Pet relocation requires preparation, documents, providers, appointments, and careful timing.",
  },
];

function Problem() {
  return (
    <section className="bg-sand">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="The reality"
          title="Moving is not just finding an apartment."
          body="Once the lease is signed, the real work starts: handover checks, cleaning, internet, curtains, furniture, maintenance, building rules, delivery slots — and if you have a pet, a whole extra layer of timing, documents, and provider coordination."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <Card key={p.title}>
              <IconBubble tone="terracotta">
                <p.icon className="h-5 w-5" />
              </IconBubble>
              <h3 className="mt-5 font-serif text-xl text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Services ---------- */

const SERVICES = [
  {
    icon: ClipboardCheck,
    title: "Apartment handover support",
    body: "Checklist, photo evidence, defect notes, building rules, and handover readiness.",
  },
  {
    icon: Sparkles,
    title: "Move-in setup coordination",
    body: "Cleaning, handyman, curtains, mattress, basic furniture, and essentials planning.",
  },
  {
    icon: Compass,
    title: "Vendor shortlist",
    body: "Curated options for cleaning, curtains, handyman, furniture, internet, and car rental.",
  },
  {
    icon: CalendarDays,
    title: "First-week setup plan",
    body: "A practical arrival timeline so you know what to do before and after landing.",
  },
  {
    icon: Wifi,
    title: "Remote support",
    body: "Guidance before you arrive, including planning calls and checklist-based support.",
  },
  {
    icon: PawPrint,
    title: "Pet relocation readiness",
    body: "Timeline, document checklist, provider comparison, vet appointment planning, and owner-side preparation.",
  },
];

function Services() {
  return (
    <section id="services" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="Services"
          title="Practical support for your first weeks in Abu Dhabi."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Card key={s.title}>
              <IconBubble>
                <s.icon className="h-5 w-5" />
              </IconBubble>
              <h3 className="mt-5 font-serif text-xl text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Pet readiness ---------- */

const PET_CARDS = [
  {
    icon: CalendarDays,
    title: "Timeline review",
    body: "Understand when to start and what milestones to track.",
  },
  {
    icon: FileText,
    title: "Document checklist",
    body: "Organize the information your licensed pet relocation provider or vet may request.",
  },
  {
    icon: Scale,
    title: "Provider comparison",
    body: "Compare quotes, services, inclusions, exclusions, and questions to ask.",
  },
  {
    icon: PlaneLanding,
    title: "Arrival planning",
    body: "Prepare the first days in Abu Dhabi for both owner and pet.",
  },
];

function PetReadiness() {
  return (
    <section id="pet" className="scroll-mt-20 bg-sand">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="Pet readiness"
          title="Moving with a pet? We help you prepare, not panic."
          body="SettleSide does not act as a veterinary authority, airline, customs broker, or pet transporter. Instead, we help owners organize the process, compare professional providers, understand timelines, prepare questions, and avoid last-minute confusion."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PET_CARDS.map((c) => (
            <Card key={c.title} className="p-5">
              <IconBubble tone="sage">
                <c.icon className="h-5 w-5" />
              </IconBubble>
              <h3 className="mt-4 font-serif text-lg text-foreground">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-terracotta/30 bg-terracotta-soft/60 p-5 sm:p-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-terracotta" />
            <p className="text-sm leading-relaxed text-foreground">
              <span className="font-semibold">Important:</span> Pet travel rules and
              requirements can change. SettleSide provides coordination and readiness
              support, not veterinary, airline, customs, or legal advice. Final requirements
              should always be confirmed with licensed providers and relevant authorities.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */

const STEPS = [
  {
    title: "Tell us your situation",
    body: "Arrival date, apartment status, pet status, family/couple/single setup, and priorities.",
  },
  {
    title: "Get a move-in plan",
    body: "We map what needs to happen before arrival, during handover, and in the first week.",
  },
  {
    title: "Coordinate the essentials",
    body: "We help shortlist vendors, track tasks, and reduce last-minute chaos.",
  },
  {
    title: "Settle in",
    body: "You arrive with a clearer plan, fewer unknowns, and a home setup path.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader eyebrow="How it works" title="A calmer way to arrive." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative">
              <Card className="h-full">
                <span className="font-serif text-2xl text-terracotta">
                  0{i + 1}
                </span>
                <h3 className="mt-3 font-serif text-xl text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Packages ---------- */

const PACKAGES = [
  {
    name: "Move-In Plan",
    blurb: "For people who want clarity before arriving.",
    price: "Custom quote",
    includes: [
      "1 planning call",
      "Personalized move-in checklist",
      "First-week setup timeline",
      "Vendor guidance",
      "Apartment readiness checklist",
    ],
    cta: "Request move-in plan",
    featured: false,
  },
  {
    name: "Apartment Setup Support",
    blurb: "For busy expats who need help coordinating the essentials.",
    price: "From — custom quote",
    includes: [
      "Move-in planning",
      "Vendor shortlist",
      "Cleaning / handyman / curtains guidance",
      "Home essentials checklist",
      "Handover support checklist",
      "WhatsApp-style task tracking",
    ],
    cta: "Request setup support",
    featured: true,
  },
  {
    name: "Home + Pet Readiness",
    blurb: "For expats moving with a dog or cat.",
    price: "Custom quote",
    includes: [
      "Apartment setup support",
      "Pet move readiness checklist",
      "Pet relocation provider comparison",
      "Pet travel timeline review",
      "Vet appointment planning checklist",
      "Arrival plan for owner and pet",
    ],
    cta: "Request pet readiness support",
    featured: false,
  },
];

function Packages() {
  return (
    <section id="packages" className="scroll-mt-20 bg-sand">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="Packages"
          title="Choose the support level you need."
          align="center"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PACKAGES.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl bg-card p-7 shadow-soft transition-shadow hover:shadow-card ${
                p.featured
                  ? "border-2 border-teal shadow-lift"
                  : "hairline"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-teal px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Most requested
                </span>
              )}
              <h3 className="font-serif text-2xl text-foreground">{p.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
              <div className="mt-5 text-sm font-medium text-teal">{p.price}</div>
              <ul className="mt-5 space-y-3 border-t border-border pt-5">
                {p.includes.map((i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-7 w-full rounded-full ${
                  p.featured
                    ? "bg-teal text-primary-foreground hover:bg-teal/90"
                    : "bg-foreground text-background hover:bg-foreground/90"
                }`}
              >
                <a href="#inquiry">{p.cta}</a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Who this is for ---------- */

const AUDIENCE = [
  { icon: Compass, title: "You are moving soon and don’t know where to start" },
  { icon: KeyRound, title: "You found an apartment but need help after the keys" },
  { icon: Home, title: "You are arriving before your home is fully ready" },
  { icon: PawPrint, title: "You are moving with a pet and want a clearer plan" },
];

function WhoFor() {
  return (
    <section className="scroll-mt-20">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader eyebrow="Who it’s for" title="Built for busy Abu Dhabi newcomers." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE.map((a) => (
            <Card key={a.title} className="p-6">
              <IconBubble tone="navy">
                <a.icon className="h-5 w-5" />
              </IconBubble>
              <p className="mt-5 font-serif text-lg leading-snug text-foreground">
                {a.title}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Why SettleSide (comparison) ---------- */

const TYPICAL = [
  "Random vendor recommendations",
  "Scattered WhatsApp messages",
  "Last-minute decisions",
  "No clear setup timeline",
  "Pet process handled too late",
];
const SS = [
  "Clear move-in plan",
  "Organized task checklist",
  "Vendor options in one place",
  "Handover and setup priorities",
  "Pet readiness timeline",
  "Calm coordination before arrival",
];

function WhyUs() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-background/80">
            <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
            Why SettleSide
          </span>
          <h2 className="mt-5 font-serif text-3xl text-background sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
            Support from your side of the move.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-background/15 bg-background/[0.04] p-7">
            <div className="text-xs font-medium uppercase tracking-wider text-background/60">
              Typical approach
            </div>
            <ul className="mt-5 space-y-3">
              {TYPICAL.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-background/80">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-background/40" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-teal/40 bg-teal/15 p-7">
            <div className="text-xs font-medium uppercase tracking-wider text-teal-soft">
              SettleSide approach
            </div>
            <ul className="mt-5 space-y-3">
              {SS.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-background">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-soft" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

const FAQS = [
  {
    q: "Are you a moving company?",
    a: "No. SettleSide is a move-in coordination and readiness service. We help plan, organize, and coordinate the practical setup around your arrival.",
  },
  {
    q: "Are you a real estate broker?",
    a: "No. We do not act as a broker or negotiate property deals. We can support apartment handover and move-in readiness from the tenant’s side.",
  },
  {
    q: "Do you transport pets?",
    a: "No. We do not transport pets. We help owners prepare, compare professional pet relocation providers, understand timelines, and organize the process.",
  },
  {
    q: "Can you guarantee pet permits or approval?",
    a: "No. Pet travel requirements are handled by relevant authorities, airlines, vets, and licensed providers. SettleSide provides coordination and readiness support only.",
  },
  {
    q: "Can you help before I arrive in Abu Dhabi?",
    a: "Yes. Much of the value is planning before arrival so your first week is less chaotic.",
  },
  {
    q: "Can you work with my building or agent?",
    a: "We can help you prepare questions, checklists, and coordination steps, but the exact scope depends on your situation and building rules.",
  },
  {
    q: "Which areas do you cover?",
    a: "The initial focus is Abu Dhabi, especially common expat areas such as Al Reem Island, Al Maryah, Saadiyat, Al Raha, Corniche, and nearby areas.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20">
      <div className="mx-auto max-w-3xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions, answered."
          align="center"
        />
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`item-${i}`}
              className="rounded-2xl border border-border bg-card px-5 shadow-soft"
            >
              <AccordionTrigger className="py-5 text-left font-serif text-lg font-medium text-foreground hover:no-underline [&[data-state=open]>svg]:rotate-0 [&>svg]:hidden">
                <span className="flex w-full items-center justify-between gap-4">
                  {f.q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sand text-teal transition-transform">
                    <Plus className="h-4 w-4 group-data-[state=open]:hidden" />
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ---------- Inquiry form ---------- */

const HELP_OPTIONS = [
  "Move-in planning",
  "Apartment handover",
  "Cleaning",
  "Furniture / mattress",
  "Curtains",
  "Handyman / maintenance",
  "Internet / utilities guidance",
  "Pet move readiness",
  "Vendor shortlist",
  "First-week setup",
];

type FormState = {
  name: string;
  email: string;
  whatsapp: string;
  location: string;
  arrival: string;
  household: string;
  apartment: string;
  pet: string;
  help: string[];
  message: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  whatsapp: "",
  location: "",
  arrival: "",
  household: "",
  apartment: "",
  pet: "",
  help: [],
  message: "",
};

function InquiryForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleHelp(label: string) {
    setForm((f) => ({
      ...f,
      help: f.help.includes(label)
        ? f.help.filter((h) => h !== label)
        : [...f.help, label],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Wire this up to your backend / email service (e.g. Resend, a server function,
    // or a CRM webhook). For now we log the payload and show a success state.
    console.log("[SettleSide inquiry]", form);
    setSubmitted(true);
    toast.success("Your move-in request has been received.");
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center sm:p-12">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal/15 text-teal">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="mt-6 font-serif text-2xl text-foreground sm:text-3xl">
          Thank you — your move-in request has been received.
        </h3>
        <p className="mt-3 text-muted-foreground">
          We’ll review your situation and get back to you shortly.
        </p>
        <Button
          variant="outline"
          className="mt-8 rounded-full"
          onClick={() => {
            setForm(EMPTY_FORM);
            setSubmitted(false);
          }}
        >
          Submit another request
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-10">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" required>
            <Input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="WhatsApp number">
            <Input
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              placeholder="+971 ..."
            />
          </Field>
          <Field label="Current country / city">
            <Input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. London, UK"
            />
          </Field>
          <Field label="Arrival date">
            <Input
              type="date"
              value={form.arrival}
              onChange={(e) => update("arrival", e.target.value)}
            />
          </Field>
          <Field label="Moving as">
            <Select value={form.household} onValueChange={(v) => update("household", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alone">Alone</SelectItem>
                <SelectItem value="couple">Couple</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="unsure">Not sure yet</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Apartment status">
            <Select value={form.apartment} onValueChange={(v) => update("apartment", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="searching">Still searching</SelectItem>
                <SelectItem value="shortlisted">Shortlisted apartments</SelectItem>
                <SelectItem value="signed">Lease signed</SelectItem>
                <SelectItem value="handover">Handover scheduled</SelectItem>
                <SelectItem value="moved-in">Already moved in</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Pet moving with you?">
            <Select value={form.pet} onValueChange={(v) => update("pet", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="dog">Yes, dog</SelectItem>
                <SelectItem value="cat">Yes, cat</SelectItem>
                <SelectItem value="multiple">Yes, multiple pets</SelectItem>
                <SelectItem value="unsure">Not sure yet</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">
            What do you need help with?
          </Label>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {HELP_OPTIONS.map((h) => {
              const checked = form.help.includes(h);
              return (
                <label
                  key={h}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                    checked
                      ? "border-teal bg-teal/5 text-foreground"
                      : "border-border bg-background text-foreground hover:bg-sand"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleHelp(h)}
                  />
                  <span>{h}</span>
                </label>
              );
            })}
          </div>
        </div>

        <Field label="Tell us more">
          <Textarea
            rows={4}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Share anything that helps us understand your move."
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full rounded-full bg-teal text-primary-foreground hover:bg-teal/90 sm:w-auto sm:self-start sm:px-8"
        >
          Request settling-in support
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-terracotta">*</span>}
      </Label>
      {children}
    </div>
  );
}

function InquirySection() {
  return (
    <section id="inquiry" className="scroll-mt-20 bg-sand">
      <div className="mx-auto max-w-4xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="Inquire"
          title="Planning a move to Abu Dhabi?"
          body="Tell us where you are in the process and what you need help with."
          align="center"
        />
        <div className="mt-12">
          <InquiryForm />
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer id="contact" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl section-px py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal text-primary-foreground">
                <KeyRound className="h-4 w-4" />
              </span>
              <span className="font-serif text-xl font-semibold text-foreground">
                SettleSide
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Move-in setup and pet relocation readiness for Abu Dhabi expats.
            </p>
            <a
              href="mailto:hello@settleside.com"
              className="mt-4 inline-block text-sm font-medium text-teal hover:underline"
            >
              hello@settleside.com
            </a>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Explore
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-foreground">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#inquiry" className="hover:text-foreground">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Coverage
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>Al Reem Island</li>
              <li>Al Maryah</li>
              <li>Saadiyat</li>
              <li>Al Raha · Corniche</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            SettleSide provides coordination and readiness support. We are not a moving
            company, real estate broker, veterinary clinic, airline, customs broker, or
            legal advisor. Final requirements and service terms should be confirmed with
            licensed providers and relevant authorities.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} SettleSide. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Page ---------- */

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Services />
        <PetReadiness />
        <HowItWorks />
        <Packages />
        <WhoFor />
        <WhyUs />
        <FAQ />
        <InquirySection />
      </main>
      <Footer />
      <Toaster richColors position="top-center" />
    </div>
  );
}

// Silence unused-import warnings for icons reserved for future content blocks.
void Users;
void Wrench;
void Minus;
void Stethoscope;

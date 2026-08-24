import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
  Users,
  Home,
  CheckCircle2,
  ArrowRight,
  Compass,
  ListChecks,
  Check,
  Plus,
  Truck,
  ShoppingBag,
  Zap,
  Boxes,
  Star,
  Globe2,
  Plug,
  MessageSquare,
  Building2,
  Search,
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
import {
  loadMarketplaceSnapshot,
  parseMoveIntakeDraft,
  submitInquiry,
} from "@/lib/settleside.functions";
import { HELP_OPTIONS } from "@/lib/settleside.schemas";
import type {
  InquirySubmissionResult,
  MarketplaceProduct,
  MarketplaceService,
  MoveIntakeDraft,
  MovePlanTask,
} from "@/lib/settleside.schemas";

export const Route = createFileRoute("/")({
  loader: () => loadMarketplaceSnapshot({ data: { destination: "Abu Dhabi" } }),
  head: () => ({
    meta: [
      { title: "SettleSide: Your end-to-end relocation assistant" },
      {
        name: "description",
        content:
          "SettleSide is the all-in-one assistant for moving to a new city: plan your move, shop home essentials, book trusted services, and add pet relocation if you need it, all in one place.",
      },
      {
        property: "og:title",
        content: "SettleSide: Your end-to-end relocation assistant",
      },
      {
        property: "og:description",
        content:
          "Plan, shop, and book everything your move needs, from movers and internet to furniture and optional pet relocation.",
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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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
    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
      {children}
    </div>
  );
}

/* ---------- Nav ---------- */

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#catalog", label: "Shop essentials" },
  { href: "#services", label: "Book services" },
  { href: "#addons", label: "Add-ons" },
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
          <Button
            asChild
            className="rounded-full bg-teal px-5 text-primary-foreground hover:bg-teal/90"
          >
            <a href="#inquiry">Start my move</a>
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
                Start my move
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
          <SectionLabel>End-to-end relocation assistant</SectionLabel>
          <h1 className="mt-6 text-4xl text-foreground sm:text-5xl md:text-[3.75rem] md:leading-[1.02]">
            Your entire move,
            <span className="text-teal"> in one place.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            SettleSide plans your relocation, then lets you shop home essentials and book trusted
            services directly, pulling live options from leading retailers and providers. Add pet
            relocation only if you need it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-teal px-6 text-primary-foreground hover:bg-teal/90"
            >
              <a href="#inquiry">
                Start my move
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-border bg-background hover:bg-sand"
            >
              <a href="#how">See how it works</a>
            </Button>
          </div>
        </div>

        {/* Hero visual: assistant card-stack */}
        <div className="relative">
          <div className="relative mx-auto grid max-w-md gap-4">
            <Card className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5 text-teal" />
                  Your move plan
                </div>
                <span className="rounded-full bg-sand px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-teal">
                  42 days to go
                </span>
              </div>
              <h3 className="mt-3 font-serif text-lg text-foreground">Berlin → Lisbon</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  ["Movers booked: Atlas Relocations", true],
                  ["Internet activation scheduled", true],
                  ["Sofa & mattress ordered", false],
                  ["Cleaning on move-out day", false],
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
                      className={done ? "text-muted-foreground line-through" : "text-foreground"}
                    >
                      {label as string}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-deep">
                  <div className="h-full w-[62%] rounded-full bg-teal" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">62%</span>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-5">
                <IconBubble tone="terracotta">
                  <ShoppingBag className="h-5 w-5" />
                </IconBubble>
                <h4 className="mt-3 font-serif text-base text-foreground">Live catalog</h4>
                <p className="mt-1 text-xs text-muted-foreground">IKEA · Wayfair · Amazon</p>
                <div className="mt-3 flex -space-x-1.5">
                  <div className="h-6 w-6 rounded-md bg-terracotta-soft hairline" />
                  <div className="h-6 w-6 rounded-md bg-sand-deep hairline" />
                  <div className="h-6 w-6 rounded-md bg-[oklch(0.93_0.03_150)] hairline" />
                </div>
              </Card>
              <Card className="p-5">
                <IconBubble tone="sage">
                  <Truck className="h-5 w-5" />
                </IconBubble>
                <h4 className="mt-3 font-serif text-base text-foreground">Service slots</h4>
                <p className="mt-1 text-xs text-muted-foreground">3 movers available</p>
                <div className="mt-3 text-xs font-medium text-[oklch(0.42_0.05_155)]">
                  Tue · Wed · Sat
                </div>
              </Card>
            </div>

            <Card className="p-5">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-teal" />
                End-to-end timeline
              </div>
              <div className="mt-3 flex items-center gap-2">
                {[
                  { d: "T-60", label: "Plan", done: true },
                  { d: "T-21", label: "Book", done: true },
                  { d: "Day 1", label: "Move", done: false },
                  { d: "Day 14", label: "Settled", done: false },
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
                      <div className={`h-px flex-1 ${s.done ? "bg-teal/40" : "bg-border"}`} />
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

/* ---------- Logos / integrations strip ---------- */

function Partners({ partners }: { partners: string[] }) {
  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-6xl section-px py-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Live inventory & availability from leading retailers and providers
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-foreground/60">
          {partners.map((p) => (
            <span key={p} className="font-serif text-lg tracking-tight">
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Tell us about your move",
    body: "Origin, destination, dates, household size, and what matters most. We build your plan in minutes.",
  },
  {
    icon: ListChecks,
    title: "Get a personalized timeline",
    body: "An end-to-end checklist from packing to settled, with the right tasks at the right time.",
  },
  {
    icon: ShoppingBag,
    title: "Shop & book in one place",
    body: "Browse live options for furniture, essentials, movers, internet, cleaning, and more, pulled directly from retailer and provider APIs.",
  },
  {
    icon: CheckCircle2,
    title: "Track everything until settled",
    body: "Orders, bookings, and deliveries all tracked together. Add optional services like pet relocation any time.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="How it works"
          title="One assistant from first box to last unpacked."
          body="SettleSide replaces a dozen tabs, spreadsheets, and group chats with a single guided flow."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Card key={s.title} className="h-full">
              <div className="flex items-center justify-between">
                <IconBubble>
                  <s.icon className="h-5 w-5" />
                </IconBubble>
                <span className="font-serif text-2xl text-terracotta">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-serif text-xl text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Catalog: Home essentials ---------- */

const PRODUCT_ICONS: Record<
  MarketplaceProduct["icon"],
  React.ComponentType<{ className?: string }>
> = {
  sofa: Sofa,
  boxes: Boxes,
  wifi: Wifi,
  shopping: ShoppingBag,
};

function CatalogTeaser({ products }: { products: MarketplaceProduct[] }) {
  return (
    <section id="catalog" className="scroll-mt-20 bg-sand">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="Shop essentials"
          title="A live catalog tuned to your new home."
          body="We pull real-time inventory, pricing, and delivery slots from retailers in your destination, so you compare and order without leaving SettleSide."
        />

        <div className="mt-10 flex items-center gap-2 rounded-full bg-card px-4 py-2.5 shadow-soft hairline">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Search "queen mattress, delivery this week"…
          </span>
          <span className="ml-auto rounded-full bg-teal px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            Live
          </span>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => {
            const ProductIcon = PRODUCT_ICONS[p.icon];

            return (
              <Card key={p.name} className="flex flex-col p-5">
                <div className={`relative h-32 overflow-hidden rounded-xl ${p.swatch}`}>
                  <div className="absolute inset-0 grid place-items-center">
                    <ProductIcon className="h-12 w-12 text-foreground/30" />
                  </div>
                  <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground">
                    {p.category}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-base text-foreground">{p.name}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-terracotta text-terracotta" />
                  <span>{p.rating}</span>
                  <span>·</span>
                  <span>{p.retailer}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-serif text-lg text-foreground">{p.price}</span>
                  <Button
                    size="sm"
                    className="rounded-full bg-foreground px-4 text-background hover:bg-foreground/90"
                  >
                    Add
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Catalog shown for illustration. Live products vary by destination and availability.
        </p>
      </div>
    </section>
  );
}

/* ---------- Services marketplace ---------- */

const SERVICE_ICONS: Record<
  MarketplaceService["icon"],
  React.ComponentType<{ className?: string }>
> = {
  truck: Truck,
  sparkles: Sparkles,
  wifi: Wifi,
  wrench: Wrench,
  shield: ShieldCheck,
  building: Building2,
  paw: PawPrint,
};

function ServicesMarketplace({ services }: { services: MarketplaceService[] }) {
  return (
    <section id="services" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="Book services"
          title="Every service your move needs, already connected."
          body="From international movers to a same-day handyman, we surface live availability from trusted providers in your city."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const ServiceIcon = SERVICE_ICONS[s.icon];

            return (
              <Card key={s.category} className="flex h-full flex-col">
                <IconBubble>
                  <ServiceIcon className="h-5 w-5" />
                </IconBubble>
                <h3 className="mt-5 font-serif text-xl text-foreground">{s.category}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs font-medium text-muted-foreground">
                    {s.providers} · {s.leadTime}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal">
                    Browse <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Add-ons (including Pet) ---------- */

const ADDONS = [
  {
    icon: PawPrint,
    title: "Pet relocation",
    body: "Optional. If you're moving with a dog, cat, or other pet, we plan the timeline, compare licensed transporters, and track documents.",
    tag: "Optional add-on",
    tone: "sage" as const,
  },
  {
    icon: Users,
    title: "Family & school search",
    body: "Shortlist schools, daycares, and family-friendly neighborhoods at your destination.",
    tag: "Optional add-on",
    tone: "terracotta" as const,
  },
  {
    icon: Globe2,
    title: "Paperwork & visas",
    body: "Guidance and provider referrals for residency, banking, and address registration.",
    tag: "Optional add-on",
    tone: "navy" as const,
  },
];

function AddOns() {
  return (
    <section id="addons" className="scroll-mt-20 bg-sand">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="Add-ons"
          title="Add what you need. Skip what you don't."
          body="Most moves are just home and services. Layer on extras only when they apply to you."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {ADDONS.map((a) => (
            <Card key={a.title} className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <IconBubble tone={a.tone}>
                  <a.icon className="h-5 w-5" />
                </IconBubble>
                <span className="rounded-full bg-card px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hairline">
                  {a.tag}
                </span>
              </div>
              <h3 className="mt-5 font-serif text-xl text-foreground">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Why SettleSide ---------- */

const TYPICAL = [
  "20 browser tabs and spreadsheets",
  "Hunting for trusted providers city by city",
  "Manual price comparisons across retailers",
  "Forgotten tasks before move day",
  "Pet logistics scrambled at the last minute",
];
const SS = [
  "One assistant, one timeline",
  "Pre-vetted retailers & providers connected via API",
  "Live pricing and availability side by side",
  "Reminders mapped to your move date",
  "Pet relocation added only if you need it",
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
            The first relocation tool that actually does the work.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-background/15 bg-background/[0.04] p-7">
            <div className="text-xs font-medium uppercase tracking-wider text-background/60">
              Without SettleSide
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
              With SettleSide
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

/* ---------- Who this is for ---------- */

const AUDIENCE = [
  {
    icon: Compass,
    title: "You're moving cities or countries and don't know where to start",
  },
  {
    icon: Home,
    title: "You've signed a lease and need to furnish & set up fast",
  },
  {
    icon: Zap,
    title: "You want fewer apps, fewer calls, and faster decisions",
  },
  {
    icon: MessageSquare,
    title: "You'd rather book everything once than chase ten providers",
  },
];

function WhoFor() {
  return (
    <section className="scroll-mt-20">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader eyebrow="Who it's for" title="Built for anyone setting up a new home." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE.map((a) => (
            <Card key={a.title} className="p-6">
              <IconBubble tone="navy">
                <a.icon className="h-5 w-5" />
              </IconBubble>
              <p className="mt-5 font-serif text-lg leading-snug text-foreground">{a.title}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

const FAQS = [
  {
    q: "Which cities or countries do you support?",
    a: "SettleSide is built to work in any city. Catalog depth and provider availability grow with each destination as we connect more retailer and service APIs.",
  },
  {
    q: "How does the catalog work?",
    a: "We integrate directly with retailer and service-provider APIs to pull live inventory, pricing, and delivery availability for your destination. You can compare and check out in one flow.",
  },
  {
    q: "Are you a moving company?",
    a: "No. SettleSide is a relocation assistant. We plan your move and connect you with trusted movers, cleaners, telcos, retailers, and other providers.",
  },
  {
    q: "Do I have to use the pet add-on?",
    a: "Not at all. Most users skip it. If you're moving with a pet, you can enable pet relocation as an optional module to plan timelines, compare transporters, and track documents.",
  },
  {
    q: "Can I use SettleSide before I've found a home?",
    a: "Yes. Start with the move plan, then add purchases and bookings as your address and dates firm up.",
  },
  {
    q: "How do you make money?",
    a: "SettleSide earns referral and partner fees from retailers and providers. You see the same prices you would on their own sites.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20">
      <div className="mx-auto max-w-3xl section-px py-20 md:py-28">
        <SectionHeader eyebrow="FAQ" title="Questions, answered." align="center" />
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
                    <Plus className="h-4 w-4" />
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

type FormState = {
  name: string;
  email: string;
  whatsapp: string;
  origin: string;
  destination: string;
  moveDate: string;
  household: string;
  status: string;
  pet: string;
  help: string[];
  message: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  whatsapp: "",
  origin: "",
  destination: "",
  moveDate: "",
  household: "",
  status: "",
  pet: "no",
  help: [],
  message: "",
};

function AiIntakeAssist({ onDraft }: { onDraft: (draft: MoveIntakeDraft) => void }) {
  const parseIntakeFn = useServerFn(parseMoveIntakeDraft);
  const [description, setDescription] = useState("");
  const [parsing, setParsing] = useState(false);

  async function handleParse() {
    setParsing(true);

    try {
      const result = await parseIntakeFn({ data: { description } });

      if (result.ok) {
        onDraft(result.draft);
        toast.success("Form pre-filled from your description. Review it and submit.");
      } else if (result.reason === "not-configured") {
        toast.info(
          "The AI assistant isn't set up on this server yet. Fill the form below instead.",
        );
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to read your move description.";
      toast.error(message);
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-teal/30 bg-teal/5 p-5 sm:p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-teal">
        <Sparkles className="h-4 w-4" />
        Describe your move and we'll fill the form for you
      </div>
      <Textarea
        rows={3}
        className="mt-3 bg-background"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder='e.g. "We are a family of four moving from London to Abu Dhabi in early September with our dog. We need movers, beds and a sofa, and internet working on day one."'
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleParse}
          disabled={parsing || description.trim().length < 20}
          className="rounded-full bg-teal px-5 text-primary-foreground hover:bg-teal/90"
        >
          {parsing ? "Reading your move..." : "Prefill with AI"}
          <Sparkles className="ml-1 h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground">
          Optional. You can also fill the form manually below.
        </span>
      </div>
    </div>
  );
}

const OWNER_TONE: Record<MovePlanTask["owner"], string> = {
  SettleSide: "bg-teal/10 text-teal",
  Customer: "bg-terracotta-soft text-terracotta",
  Provider: "bg-[oklch(0.93_0.03_150)] text-[oklch(0.42_0.05_155)]",
};

function MovePlanResult({
  submission,
  onReset,
}: {
  submission: InquirySubmissionResult | null;
  onReset: () => void;
}) {
  if (!submission) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center sm:p-12">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal/15 text-teal">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="mt-6 font-serif text-2xl text-foreground">Your move request is in.</h3>
        <p className="mt-3 text-muted-foreground">We'll be in touch shortly.</p>
        <Button variant="outline" className="mt-8 rounded-full" onClick={onReset}>
          Plan another move
        </Button>
      </Card>
    );
  }

  const { plan, matchedServices, matchedProducts } = submission;

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-6 sm:p-10">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-teal/15 text-teal">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-foreground sm:text-3xl">
              Your move plan is ready.
            </h3>
            <p className="mt-2 text-muted-foreground">{plan.summary}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ListChecks className="h-4 w-4 text-teal" />
            Your timeline · {plan.tasks.length} steps
          </div>
          <ol className="mt-4 space-y-3">
            {plan.tasks.map((task, index) => (
              <li
                key={`${task.title}-${task.timing}`}
                className="flex gap-4 rounded-xl bg-sand p-4"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-background text-xs font-semibold text-teal hairline">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{task.title}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {task.timing}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${OWNER_TONE[task.owner]}`}
                    >
                      {task.owner === "SettleSide" ? "We handle it" : task.owner}
                    </span>
                    <span className="text-muted-foreground">{task.category}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Matched services */}
        {matchedServices.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-teal" />
              Vetted providers matched to your move
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {matchedServices.map((service) => {
                const ServiceIcon = SERVICE_ICONS[service.icon];
                return (
                  <div key={service.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2">
                      <ServiceIcon className="h-4 w-4 text-teal" />
                      <span className="font-serif text-base text-foreground">
                        {service.category}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {service.body}
                    </p>
                    <div className="mt-2 text-xs font-medium text-muted-foreground">
                      {service.providers} · {service.leadTime}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Matched products */}
        {matchedProducts.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShoppingBag className="h-4 w-4 text-teal" />
              Home essentials for your new place
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {matchedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {product.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {product.retailer} · {product.deliveryWindow}
                    </div>
                  </div>
                  <span className="shrink-0 font-serif text-sm text-foreground">
                    {product.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concierge next step */}
        <div className="mt-8 rounded-2xl border border-teal/30 bg-teal/5 p-5 sm:p-6">
          <h4 className="font-serif text-lg text-foreground">Want us to run this for you?</h4>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The plan above is yours to keep and use. If you'd rather not chase fifteen providers
            while starting a new job, SettleSide can take it from here: we collect comparable
            quotes, book everything, and coordinate through move-in day, with one person as your
            single point of contact.
          </p>
          <p className="mt-3 text-sm font-medium text-foreground">
            We'll reach out within one business day with options and pricing.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <div className="text-xs text-muted-foreground">
            Reference <span className="font-mono text-foreground">{submission.id}</span> · a copy is
            on its way to your inbox
          </div>
          <Button variant="outline" className="rounded-full" onClick={onReset}>
            Plan another move
          </Button>
        </div>
      </Card>
    </div>
  );
}

function InquiryForm() {
  const submitInquiryFn = useServerFn(submitInquiry);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<InquirySubmissionResult | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function applyDraft(draft: MoveIntakeDraft) {
    setForm((f) => ({
      ...f,
      name: draft.name || f.name,
      email: draft.email || f.email,
      whatsapp: draft.whatsapp || f.whatsapp,
      origin: draft.origin || f.origin,
      destination: draft.destination || f.destination,
      moveDate: draft.moveDate || f.moveDate,
      household: draft.household || f.household,
      status: draft.status || f.status,
      pet: draft.pet !== "no" ? draft.pet : f.pet,
      help: draft.help.length > 0 ? [...draft.help] : f.help,
      message: draft.message || f.message,
    }));
  }

  function toggleHelp(label: string) {
    setForm((f) => ({
      ...f,
      help: f.help.includes(label) ? f.help.filter((h) => h !== label) : [...f.help, label],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await submitInquiryFn({ data: form });
      setSubmission(result);
      setSubmitted(true);
      toast.success(`Your move request ${result.id} has been received.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit your move request.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <MovePlanResult
        submission={submission}
        onReset={() => {
          setForm(EMPTY_FORM);
          setSubmitted(false);
          setSubmission(null);
        }}
      />
    );
  }

  return (
    <Card className="p-6 sm:p-10">
      <AiIntakeAssist onDraft={applyDraft} />
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Your move details
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
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
          <Field label="WhatsApp / phone">
            <Input
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              placeholder="+1 ..."
            />
          </Field>
          <Field label="Moving from">
            <Input
              value={form.origin}
              onChange={(e) => update("origin", e.target.value)}
              placeholder="City, country"
            />
          </Field>
          <Field label="Moving to" required>
            <Input
              required
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
              placeholder="City, country"
            />
          </Field>
          <Field label="Target move date">
            <Input
              type="date"
              value={form.moveDate}
              onChange={(e) => update("moveDate", e.target.value)}
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
          <Field label="Where are you in the process?">
            <Select value={form.status} onValueChange={(v) => update("status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exploring">Just exploring</SelectItem>
                <SelectItem value="planning">Actively planning</SelectItem>
                <SelectItem value="signed">Home secured</SelectItem>
                <SelectItem value="imminent">Moving in 30 days</SelectItem>
                <SelectItem value="arrived">Already arrived</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Moving with a pet?">
            <Select value={form.pet} onValueChange={(v) => update("pet", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="dog">Yes, dog</SelectItem>
                <SelectItem value="cat">Yes, cat</SelectItem>
                <SelectItem value="multiple">Yes, multiple pets</SelectItem>
                <SelectItem value="other">Yes, other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">What do you want help with?</Label>
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
                  <Checkbox checked={checked} onCheckedChange={() => toggleHelp(h)} />
                  <span>{h}</span>
                </label>
              );
            })}
          </div>
        </div>

        <Field label="Anything else we should know?">
          <Textarea
            rows={4}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Tell us about your move, your home, or your priorities."
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="mt-2 w-full rounded-full bg-teal text-primary-foreground hover:bg-teal/90 sm:w-auto sm:self-start sm:px-8"
        >
          {submitting ? "Building plan..." : "Build my move plan"}
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
          eyebrow="Start your move"
          title="Tell us about your move."
          body="We'll build your personalized plan and surface live catalog and service options for your destination."
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
              <span className="font-serif text-xl font-semibold text-foreground">SettleSide</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The end-to-end relocation assistant. Plan, shop, and book your entire move in one
              place.
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
              Modules
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>Move planning</li>
              <li>Home essentials catalog</li>
              <li>Services marketplace</li>
              <li>Pet relocation add-on</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Globe2 className="h-3.5 w-3.5 text-teal" /> Any city
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Plug className="h-3.5 w-3.5 text-teal" /> Live retailer & provider APIs
          </span>
          <span className="inline-flex items-center gap-1.5">
            <PawPrint className="h-3.5 w-3.5 text-teal" /> Pet add-on
          </span>
        </div>
        <div className="mt-8 border-t border-border pt-6">
          <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            SettleSide is a relocation assistant connecting users with retailers and service
            providers via official APIs and partnerships. We are not a moving company, real estate
            broker, telco, veterinary clinic, airline, customs broker, or legal advisor. Final terms
            and requirements are set by each provider.
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
  const marketplace = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Partners partners={marketplace.partners} />
        <HowItWorks />
        <CatalogTeaser products={marketplace.products} />
        <ServicesMarketplace services={marketplace.services} />
        <AddOns />
        <WhyUs />
        <WhoFor />
        <FAQ />
        <InquirySection />
      </main>
      <Footer />
      <Toaster richColors position="top-center" />
    </div>
  );
}

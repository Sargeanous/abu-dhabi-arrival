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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SettleSide — Your end-to-end relocation assistant" },
      {
        name: "description",
        content:
          "SettleSide is the all-in-one assistant for moving to a new city: plan your move, shop home essentials, book trusted services, and add pet relocation if you need it — all in one place.",
      },
      { property: "og:title", content: "SettleSide — Your end-to-end relocation assistant" },
      {
        property: "og:description",
        content:
          "Plan, shop, and book everything your move needs — from movers and internet to furniture and optional pet relocation.",
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
          <Button asChild className="rounded-full bg-teal px-5 text-primary-foreground hover:bg-teal/90">
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
            SettleSide plans your relocation, then lets you shop home essentials and book
            trusted services directly — pulling live options from leading retailers and
            providers. Add pet relocation only if you need it.
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
          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5 text-teal" /> Any city</span>
            <span className="inline-flex items-center gap-1.5"><Plug className="h-3.5 w-3.5 text-teal" /> Live retailer & provider APIs</span>
            <span className="inline-flex items-center gap-1.5"><PawPrint className="h-3.5 w-3.5 text-teal" /> Pet add-on</span>
          </p>
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
                  ["Movers booked — Atlas Relocations", true],
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
                    <span className={done ? "text-muted-foreground line-through" : "text-foreground"}>
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
                <div className="mt-3 text-xs font-medium text-[oklch(0.42_0.05_155)]">Tue · Wed · Sat</div>
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
                      <span className="mt-1 text-[10px] font-medium text-foreground">{s.label}</span>
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

const PARTNERS = [
  "IKEA", "Amazon", "Wayfair", "Vodafone", "Atlas Movers", "Helpling", "Made.com", "Allianz",
];

function Partners() {
  return (
    <section className="border-y border-border bg-card/50">
      <div className="mx-auto max-w-6xl section-px py-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Live inventory & availability from leading retailers and providers
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-foreground/60">
          {PARTNERS.map((p) => (
            <span key={p} className="font-serif text-lg tracking-tight">{p}</span>
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
    body: "Browse live options for furniture, essentials, movers, internet, cleaning, and more — pulled directly from retailer and provider APIs.",
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
                <IconBubble><s.icon className="h-5 w-5" /></IconBubble>
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

type Product = {
  category: string;
  name: string;
  retailer: string;
  price: string;
  rating: number;
  swatch: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PRODUCTS: Product[] = [
  { category: "Mattress", name: "Hybrid Memory Foam Queen", retailer: "Emma", price: "€599", rating: 4.7, swatch: "bg-sand-deep", icon: Sofa },
  { category: "Sofa", name: "Linen 3-Seater · Sand", retailer: "Made.com", price: "€849", rating: 4.5, swatch: "bg-terracotta-soft", icon: Sofa },
  { category: "Kitchen starter", name: "30-piece essentials box", retailer: "IKEA", price: "€129", rating: 4.6, swatch: "bg-[oklch(0.93_0.03_150)]", icon: Boxes },
  { category: "Internet", name: "1 Gbps fiber · no contract", retailer: "Vodafone", price: "€39/mo", rating: 4.3, swatch: "bg-[oklch(0.93_0.02_240)]", icon: Wifi },
];

function CatalogTeaser() {
  return (
    <section id="catalog" className="scroll-mt-20 bg-sand">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="Shop essentials"
            title="A live catalog tuned to your new home."
            body="We pull real-time inventory, pricing, and delivery slots from retailers in your destination — so you compare and order without leaving SettleSide."
          />
          <div className="hidden items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-medium text-muted-foreground hairline md:inline-flex">
            <Plug className="h-3.5 w-3.5 text-teal" /> Powered by retailer APIs
          </div>
        </div>

        <div className="mt-10 flex items-center gap-2 rounded-full bg-card px-4 py-2.5 shadow-soft hairline">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search "queen mattress, delivery this week"…</span>
          <span className="ml-auto rounded-full bg-teal px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            Live
          </span>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p) => (
            <Card key={p.name} className="flex flex-col p-5">
              <div className={`relative h-32 overflow-hidden rounded-xl ${p.swatch}`}>
                <div className="absolute inset-0 grid place-items-center">
                  <p.icon className="h-12 w-12 text-foreground/30" />
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
                <Button size="sm" className="rounded-full bg-foreground px-4 text-background hover:bg-foreground/90">
                  Add
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Catalog shown for illustration. Live products vary by destination and availability.
        </p>
      </div>
    </section>
  );
}

/* ---------- Services marketplace ---------- */

type Service = {
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  body: string;
  providers: string;
};

const SERVICES: Service[] = [
  { icon: Truck, category: "Movers & shipping", body: "Compare quotes from vetted international and local movers.", providers: "12 providers" },
  { icon: Sparkles, category: "Cleaning", body: "Move-in & move-out deep cleans booked in a few taps.", providers: "8 providers" },
  { icon: Wifi, category: "Internet & utilities", body: "Set up fiber, mobile, power, and water on day one.", providers: "Local telcos" },
  { icon: Wrench, category: "Handyman & install", body: "Curtains, TV mount, assembly — booked to your move-in date.", providers: "20+ pros" },
  { icon: ShieldCheck, category: "Insurance", body: "Renters and contents cover from licensed brokers.", providers: "5 brokers" },
  { icon: Building2, category: "Storage", body: "Short-term storage for the awkward gap between homes.", providers: "Local & national" },
];

function ServicesMarketplace() {
  return (
    <section id="services" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader
          eyebrow="Book services"
          title="Every service your move needs — already connected."
          body="From international movers to a same-day handyman, we surface live availability from trusted providers in your city."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <Card key={s.category} className="flex h-full flex-col">
              <IconBubble><s.icon className="h-5 w-5" /></IconBubble>
              <h3 className="mt-5 font-serif text-xl text-foreground">{s.category}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs font-medium text-muted-foreground">{s.providers}</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal">
                  Browse <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Card>
          ))}
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
                <IconBubble tone={a.tone}><a.icon className="h-5 w-5" /></IconBubble>
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
  { icon: Compass, title: "You're moving cities or countries and don't know where to start" },
  { icon: Home, title: "You've signed a lease and need to furnish & set up fast" },
  { icon: Zap, title: "You want fewer apps, fewer calls, and faster decisions" },
  { icon: MessageSquare, title: "You'd rather book everything once than chase ten providers" },
];

function WhoFor() {
  return (
    <section className="scroll-mt-20">
      <div className="mx-auto max-w-6xl section-px py-20 md:py-28">
        <SectionHeader eyebrow="Who it's for" title="Built for anyone setting up a new home." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE.map((a) => (
            <Card key={a.title} className="p-6">
              <IconBubble tone="navy"><a.icon className="h-5 w-5" /></IconBubble>
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

const HELP_OPTIONS = [
  "Movers & shipping",
  "Furniture & mattress",
  "Kitchen & essentials",
  "Cleaning",
  "Internet & utilities",
  "Handyman / installation",
  "Insurance",
  "Storage",
  "Pet relocation (optional)",
  "Family & school search (optional)",
];

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

function InquiryForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleHelp(label: string) {
    setForm((f) => ({
      ...f,
      help: f.help.includes(label) ? f.help.filter((h) => h !== label) : [...f.help, label],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[SettleSide inquiry]", form);
    setSubmitted(true);
    toast.success("Your move request has been received.");
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center sm:p-12">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal/15 text-teal">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="mt-6 font-serif text-2xl text-foreground sm:text-3xl">
          Thanks — your move request has been received.
        </h3>
        <p className="mt-3 text-muted-foreground">
          We'll build your move plan and reach out shortly with your tailored catalog.
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
          className="mt-2 w-full rounded-full bg-teal text-primary-foreground hover:bg-teal/90 sm:w-auto sm:self-start sm:px-8"
        >
          Build my move plan
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
              The end-to-end relocation assistant. Plan, shop, and book your entire move in one place.
            </p>
            <a
              href="mailto:hello@settleside.com"
              className="mt-4 inline-block text-sm font-medium text-teal hover:underline"
            >
              hello@settleside.com
            </a>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Explore</div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-foreground">{l.label}</a>
                </li>
              ))}
              <li>
                <a href="#inquiry" className="hover:text-foreground">Contact</a>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Modules</div>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>Move planning</li>
              <li>Home essentials catalog</li>
              <li>Services marketplace</li>
              <li>Pet relocation add-on</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            SettleSide is a relocation assistant connecting users with retailers and service
            providers via official APIs and partnerships. We are not a moving company, real
            estate broker, telco, veterinary clinic, airline, customs broker, or legal advisor.
            Final terms and requirements are set by each provider.
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
        <Partners />
        <HowItWorks />
        <CatalogTeaser />
        <ServicesMarketplace />
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

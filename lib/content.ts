import type { Capability, MethodStep, NavItem, Project } from "@/types/content";

export const site = {
  name: "Lumimt",
  role: "Software House",
  city: "São Paulo",
  country: "Brasil",
  coordinates: "23°33′S 46°38′W",
  year: "2026",
  email: "lumimt.tech@gmail.com",
  tagline: "Beyond the known.",
  description:
    "Lumimt is a software house in São Paulo. We design and build digital products — web platforms, SaaS, internal systems, integrations and applied AI — for companies that have outgrown off-the-shelf software.",
  url: "https://lumimt.com",
} as const;

export const navItems: NavItem[] = [
  { id: "01", label: "About", href: "#about" },
  { id: "02", label: "Capabilities", href: "#capabilities" },
  { id: "03", label: "Work", href: "#work" },
  { id: "04", label: "Contact", href: "#contact" },
];

export const methodSteps: MethodStep[] = [
  {
    id: "01",
    name: "Signal",
    note: "Something in the business does not add up. That is the first evidence.",
  },
  {
    id: "02",
    name: "Detection",
    note: "We separate the real problem from the noise around it, and size what it is worth.",
  },
  {
    id: "03",
    name: "Exploration",
    note: "Constraints, users, data and edge cases mapped before a line of code exists.",
  },
  {
    id: "04",
    name: "System",
    note: "Architecture, interface and technical decisions designed as one object.",
  },
  {
    id: "05",
    name: "Build",
    note: "We ship it, measure it, and keep it evolving once it is in real hands.",
  },
];

export const capabilities: Capability[] = [
  {
    id: "01",
    title: "Product Development",
    description:
      "Digital products from first principles: discovery, architecture, interface, engineering and release. We take ownership of the outcome, not of a backlog.",
    tags: ["Discovery", "Product design", "Prototyping", "Roadmap"],
  },
  {
    id: "02",
    title: "Web Platforms",
    description:
      "High-performance applications and operational dashboards, for products where speed, clarity and data density decide whether people keep using them.",
    tags: ["Next.js", "React", "TypeScript", "Design systems"],
  },
  {
    id: "03",
    title: "SaaS",
    description:
      "Multi-tenant products built to be sold: authentication, billing, permissions, analytics and the operational layer that keeps them alive.",
    tags: ["Multi-tenancy", "Billing", "Auth", "Observability"],
  },
  {
    id: "04",
    title: "AI & Automation",
    description:
      "Language models, retrieval and automation applied where they remove real work — measured against a baseline instead of a demo.",
    tags: ["LLM integration", "RAG", "Agents", "Workflow automation"],
  },
  {
    id: "05",
    title: "System Integration",
    description:
      "APIs, legacy systems and third-party services connected into a single coherent surface, with the failure modes actually handled.",
    tags: ["REST / GraphQL", "Webhooks", "ERP / CRM", "Data pipelines"],
  },
];

/* ------------------------------------------------------------------
   PLACEHOLDER CONTENT — replace before launch.

   These are structural stand-ins so the Work index can be evaluated
   as a composition. They are not real engagements. Swap the names,
   sectors and copy for delivered projects, and replace <LightCurve>
   inside WorkSection with next/image once real screenshots exist.
------------------------------------------------------------------ */
export const projects: Project[] = [
  {
    id: "01",
    name: "3M — PED",
    sector: "Industry",
    kind: "Incentive platform",
    year: "2024",
    description:
      "The Distribution Excellence Programme dashboard: targets, execution indicators and distributor rewards, updated daily.",
    stack: ["Performance", "Store execution", "User management"],
    curve: { center: 0.46, depth: 0.62, noise: 0.35 },
    href: "https://www.ped.3m.com",
  },
  {
    id: "02",
    name: "Castech",
    sector: "Industrial machinery",
    kind: "Online shop",
    year: "",
    description:
      "A catalogue of new and used machines and parts, with specifications per model and quotes straight through WhatsApp.",
    stack: ["Catalogue", "Brand filter", "WhatsApp"],
    curve: { center: 0.58, depth: 0.44, noise: 0.5 },
    href: "https://www.castechmanutencao.com.br",
  },
  {
    id: "03",
    name: "NIV",
    sector: "Design",
    kind: "Studio site",
    year: "",
    description:
      "A design studio's site, its work shown in vertical format and linked through to Instagram.",
    stack: ["Portfolio", "Instagram", "Mobile-first"],
    curve: { center: 0.38, depth: 0.78, noise: 0.28 },
    href: "https://nivdesign.com.br",
  },
];

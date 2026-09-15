/** One entry in the site index. */
export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export const site = {
  name: "Lumimt",
  role: "Software House",
  city: "São Paulo",
  country: "Brasil",
  coordinates: "23°33′S 46°38′W",
  year: "2026",
  email: "lumimt.tech@gmail.com",
  /** Formspree delivers the contact form to the address above. */
  formEndpoint: "https://formspree.io/f/xbgjnwgp",
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

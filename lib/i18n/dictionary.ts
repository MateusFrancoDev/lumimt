export type Locale = "pt" | "en";

export const LOCALES: Locale[] = ["pt", "en"];
export const DEFAULT_LOCALE: Locale = "pt";

export interface CapabilityCopy {
  id: string;
  /** The geological era this capability is shown as. */
  era: string;
  /** What happened to the planet in that era, in one line. */
  note: string;
  title: string;
  description: string;
}

export interface ProjectCopy {
  id: string;
  name: string;
  sector: string;
  kind: string;
  year: string;
  description: string;
  stack: string[];
  /** The project itself, live. */
  href: string;
}

export interface Dictionary {
  label: string;
  htmlLang: string;
  nav: { about: string; capabilities: string; work: string; contact: string };
  common: {
    scroll: string;
    scrollHint: string;
    switchTo: string;
    close: string;
    index: string;
    sections: string;
    toTop: string;
    place: string;
    copy: string;
    copied: string;
  };
  signal: {
    marker: string;
    headline: [string, string];
    role: string;
    place: string;
    since: string;
    lead: string;
  };
  about: { marker: string; statement: string; paragraphs: string[] };
  capabilities: { marker: string; eraWord: string; items: CapabilityCopy[] };
  work: { marker: string; hint: string; visit: string; items: ProjectCopy[] };
  contact: {
    marker: string;
    statement: string;
    lead: string;
    name: string;
    email: string;
    message: string;
    placeholder: string;
    send: string;
    note: string;
    missing: string;
    missingEmail: string;
    invalidEmail: string;
    sending: string;
    sent: string;
    failed: string;
    direct: string;
    copyLabel: string;
  };
}

/* ------------------------------------------------------------------
   Portuguese is the source language: this is a São Paulo company and
   its visitors are Brazilian. English is the translation.
------------------------------------------------------------------ */

const pt: Dictionary = {
  label: "PT",
  htmlLang: "pt-BR",
  nav: { about: "Sobre", capabilities: "O que fazemos", work: "Projetos", contact: "Contato" },
  common: {
    scroll: "Role para viajar",
    scrollHint: "Role para continuar",
    switchTo: "English",
    close: "Fechar",
    index: "Menu",
    sections: "Seções",
    toTop: "Lumimt, voltar ao início",
    place: "São Paulo — Brasil",
    copy: "Copiar e-mail",
    copied: "E-mail copiado",
  },
  signal: {
    marker: "Sinal",
    headline: ["Além do", "que se conhece."],
    role: "Software House",
    place: "São Paulo — Brasil",
    since: "Desde 2026",
    lead: "Projetamos e construímos produtos digitais para o que vem a seguir.",
  },
  about: {
    marker: "Sobre",
    statement: "Todo produto começa como um sinal.",
    paragraphs: [
      "Muito antes de existir um produto existe uma perturbação. Um processo que custa caro demais, um número que ninguém sabe explicar, uma ideia que ainda não tem forma.",
      "A Lumimt é uma software house. Projetamos e desenvolvemos produtos digitais para empresas que já passaram do ponto em que software de prateleira resolve — e ficamos responsáveis desde a primeira conversa até a versão rodando em produção.",
    ],
  },
  capabilities: {
    marker: "O que fazemos",
    eraWord: "Era",
    items: [
      {
        id: "01",
        era: "1ª Era · Arqueozoica",
        note: "Resfriamento do planeta e surgimento da primeira bactéria unicelular.",
        title: "Desenvolvimento de Produto",
        description:
          "Produtos digitais desde o primeiro princípio: descoberta, arquitetura, interface, engenharia e lançamento. Assumimos o resultado, não um backlog.",
      },
      {
        id: "02",
        era: "2ª Era · Proterozoica",
        note: "Acúmulo de oxigênio na atmosfera e primeiras algas marinhas.",
        title: "Plataformas Web",
        description:
          "Aplicações e painéis operacionais de alta performance, para produtos em que velocidade, clareza e densidade de dados decidem se as pessoas continuam usando.",
      },
      {
        id: "03",
        era: "3ª Era · Paleozoica",
        note: "Explosão de vida nos oceanos; surgimento de anfíbios, insetos e florestas.",
        title: "SaaS",
        description:
          "Produtos multi-inquilino feitos para serem vendidos: autenticação, cobrança, permissões, analytics e toda a camada operacional que os mantém de pé.",
      },
      {
        id: "04",
        era: "4ª Era · Mesozoica",
        note: "A era dos grandes dinossauros e fragmentação da Pangeia.",
        title: "IA e Automação",
        description:
          "Modelos de linguagem, recuperação de informação e automação aplicados onde eliminam trabalho real — medidos contra uma linha de base, não contra uma demonstração.",
      },
      {
        id: "05",
        era: "5ª Era · Cenozoica",
        note: "A era dos mamíferos e do surgimento do ser humano.",
        title: "Integração de Sistemas",
        description:
          "APIs, sistemas legados e serviços de terceiros conectados numa superfície única e coerente, com os modos de falha realmente tratados.",
      },
    ],
  },
  work: {
    marker: "Projetos",
    hint: "Clique em um ponto do anel",
    visit: "Abrir o projeto",
    items: [
      {
        id: "01",
        name: "3M — PED",
        sector: "Indústria",
        kind: "Plataforma de incentivo",
        year: "2024",
        description:
          "Painel do Programa de Excelência de Distribuição: metas, indicadores de execução e premiação dos distribuidores, atualizados todo dia.",
        stack: ["Performance", "Execução no PDV", "Gestão de usuários"],
        href: "https://www.ped.3m.com",
      },
      {
        id: "02",
        name: "Castech",
        sector: "Máquinas industriais",
        kind: "Loja online",
        year: "",
        description:
          "Catálogo de máquinas novas, usadas e peças, com ficha técnica por modelo e orçamento direto pelo WhatsApp.",
        stack: ["Catálogo", "Filtro por marca", "WhatsApp"],
        href: "https://www.castechmanutencao.com.br",
      },
      {
        id: "03",
        name: "NIV",
        sector: "Design",
        kind: "Site institucional",
        year: "",
        description:
          "Site de um estúdio de design, com os trabalhos apresentados em formato vertical e ligados ao Instagram.",
        stack: ["Portfólio", "Instagram", "Mobile-first"],
        href: "https://nivdesign.com.br",
      },
    ],
  },
  contact: {
    marker: "Contato",
    statement: "Vamos construir o que vem a seguir.",
    lead: "Você percorreu todo esse caminho atrás de um sinal. Mande o seu.",
    name: "Nome",
    email: "E-mail",
    message: "Sua ideia",
    placeholder: "O problema, a restrição ou a ideia ainda sem forma.",
    send: "Enviar sinal",
    note: "Respondemos no e-mail que você deixar.",
    missing: "Escreva a ideia antes de enviar.",
    missingEmail: "Deixe um e-mail para podermos responder.",
    invalidEmail: "Confira o e-mail digitado.",
    sending: "Enviando",
    sent: "Sinal recebido. Respondemos em breve no e-mail que você deixou.",
    failed: "Não conseguimos enviar agora. Tente de novo ou escreva direto para o endereço abaixo.",
    direct: "Ou escreva direto para",
    copyLabel: "Copiar endereço",
  },
};

const en: Dictionary = {
  label: "EN",
  htmlLang: "en",
  nav: { about: "About", capabilities: "Capabilities", work: "Work", contact: "Contact" },
  common: {
    scroll: "Scroll to travel",
    scrollHint: "Scroll to continue",
    switchTo: "Português",
    close: "Close",
    index: "Menu",
    sections: "Sections",
    toTop: "Lumimt, back to top",
    place: "São Paulo — Brazil",
    copy: "Copy email",
    copied: "Email copied",
  },
  signal: {
    marker: "Signal",
    headline: ["Beyond", "the known."],
    role: "Software House",
    place: "São Paulo — Brazil",
    since: "Est. 2026",
    lead: "We design and build digital products for what comes next.",
  },
  about: {
    marker: "About",
    statement: "Every product starts as a signal.",
    paragraphs: [
      "Long before there is a product there is a disturbance. A process that costs too much, a number nobody can explain, an idea with no shape yet.",
      "Lumimt is a software house. We design and engineer digital products for companies that have outgrown off-the-shelf software — and stay accountable from the first conversation to the version running in production.",
    ],
  },
  capabilities: {
    marker: "Capabilities",
    eraWord: "Era",
    items: [
      {
        id: "01",
        era: "1st Era · Archeozoic",
        note: "The planet cools and the first single-celled bacteria appear.",
        title: "Product Development",
        description:
          "Digital products from first principles: discovery, architecture, interface, engineering and release. We take ownership of the outcome, not of a backlog.",
      },
      {
        id: "02",
        era: "2nd Era · Proterozoic",
        note: "Oxygen builds up in the atmosphere; the first marine algae.",
        title: "Web Platforms",
        description:
          "High-performance applications and operational dashboards, for products where speed, clarity and data density decide whether people keep using them.",
      },
      {
        id: "03",
        era: "3rd Era · Paleozoic",
        note: "Life explodes in the oceans; amphibians, insects and forests appear.",
        title: "SaaS",
        description:
          "Multi-tenant products built to be sold: authentication, billing, permissions, analytics and the operational layer that keeps them alive.",
      },
      {
        id: "04",
        era: "4th Era · Mesozoic",
        note: "The age of the great dinosaurs, and Pangaea breaks apart.",
        title: "AI & Automation",
        description:
          "Language models, retrieval and automation applied where they remove real work — measured against a baseline instead of a demo.",
      },
      {
        id: "05",
        era: "5th Era · Cenozoic",
        note: "The age of mammals, and the rise of humans.",
        title: "System Integration",
        description:
          "APIs, legacy systems and third-party services connected into a single coherent surface, with the failure modes actually handled.",
      },
    ],
  },
  work: {
    marker: "Work",
    hint: "Click a point on the ring",
    visit: "Open the project",
    items: [
      {
        id: "01",
        name: "3M — PED",
        sector: "Industry",
        kind: "Incentive platform",
        year: "2024",
        description:
          "The Distribution Excellence Programme dashboard: targets, execution indicators and distributor rewards, updated daily.",
        stack: ["Performance", "Store execution", "User management"],
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
        href: "https://nivdesign.com.br",
      },
    ],
  },
  contact: {
    marker: "Contact",
    statement: "Let's build what's next.",
    lead: "You came all this way on a signal. Send us yours.",
    name: "Name",
    email: "Email",
    message: "Your idea",
    placeholder: "The problem, the constraint, or the half-formed idea.",
    send: "Send a signal",
    note: "We reply to the email you leave.",
    missing: "Write the idea before sending.",
    missingEmail: "Leave an email so we can reply.",
    invalidEmail: "Check the email address.",
    sending: "Sending",
    sent: "Signal received. We'll reply soon at the email you left.",
    failed: "We couldn't send it just now. Try again, or write straight to the address below.",
    direct: "Or write straight to",
    copyLabel: "Copy address",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { pt, en };

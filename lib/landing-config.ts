export type SectionId =
  | "ticker"
  | "hero"
  | "games_catalog"
  | "how_it_works"
  | "features"
  | "faq"
  | "support_banner";

export interface HeroConfig {
  badgeText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryBadgeText: string;
  backgroundImageUrl: string;
  bgOpacity?: number; // 0 to 100 percentage
  themeColor: "cyan" | "emerald" | "amber" | "purple";
  trustBadges: Array<{ id: string; icon: string; text: string }>;
}

export interface TickerConfig {
  enabled: boolean;
  label: string;
  customItems: string[];
}

export interface GamesCatalogConfig {
  badge: string;
  title: string;
  subtitle: string;
  columns: 2 | 3 | 4;
  showSearchBar: boolean;
  featuredBadgeText: string;
}

export interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface WhyChooseUsConfig {
  title: string;
  titleHighlight: string;
  subtitle: string;
  features: FeatureItem[];
}

export interface HowItWorksStep {
  id: string;
  stepNumber: string;
  title: string;
  description: string;
  icon: string;
}

export interface HowItWorksConfig {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  steps: HowItWorksStep[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQConfig {
  badge: string;
  title: string;
  subtitle: string;
  items: FAQItem[];
}

export interface SupportBannerConfig {
  enabled: boolean;
  badge: string;
  title: string;
  description: string;
  telegramUsername: string;
  telegramLink: string;
  buttonText: string;
}

export interface LandingPageConfig {
  themeMode: "dark" | "light";
  sectionsOrder: SectionId[];
  sectionsVisibility: Record<SectionId, boolean>;
  hero: HeroConfig;
  ticker: TickerConfig;
  gamesCatalog: GamesCatalogConfig;
  howItWorks: HowItWorksConfig;
  whyChooseUs: WhyChooseUsConfig;
  faq: FAQConfig;
  supportBanner: SupportBannerConfig;
}

export const ALL_SECTION_METADATA: Array<{ id: SectionId; name: string; nameKh: string; descKh: string }> = [
  {
    id: "ticker",
    name: "Live Orders Ticker",
    nameKh: "របារបញ្ជាទិញផ្ទាល់ (Live Ticker)",
    descKh: "របាររំកិលបង្ហាញការទិញពេជ្រចុងក្រោយតាម KHQR",
  },
  {
    id: "hero",
    name: "Hero Banner",
    nameKh: "ផ្ទាំងធំខាងលើ (Hero Banner)",
    descKh: "ចំណងជើងធំ ប៊ូតុងបញ្ជាទិញ និងរូបភាព Background",
  },
  {
    id: "games_catalog",
    name: "Games Catalog",
    nameKh: "បញ្ជីហ្គេម (Games Catalog)",
    descKh: "តារាងកាតហ្គេមទាំងអស់ និងតម្លៃចាប់ផ្តើម",
  },
  {
    id: "how_it_works",
    name: "How It Works (Steps)",
    nameKh: "របៀបបញ្ចូលពេជ្រ 3 ជំហាន (How It Works)",
    descKh: "ការណែនាំពីរបៀបបញ្ចូលពេជ្រងាយៗសម្រាប់អតិថិជនថ្មី",
  },
  {
    id: "features",
    name: "Why Choose Us",
    nameKh: "ហេតុអ្វីជ្រើសរើសយើងខ្ញុំ (Why Choose Us)",
    descKh: "ចំណុចពិសេស និងទំនុកចិត្តសុវត្ថិភាព 100%",
  },
  {
    id: "faq",
    name: "FAQ Section",
    nameKh: "សំណួរដែលសួរញឹកញាប់ (FAQ)",
    descKh: "ចម្លើយចំពោះសំណួរនានាអំពីការទូទាត់ និងពេលវេលាចូលពេជ្រ",
  },
  {
    id: "support_banner",
    name: "Support / Contact Banner",
    nameKh: "ផ្ទាំងជំនួយអតិថិជន (Customer Support)",
    descKh: "ប៊ូតុងទាក់ទងមកក្រុមការងារតាម Telegram 24/7",
  },
];

export const DEFAULT_LANDING_CONFIG: LandingPageConfig = {
  themeMode: "dark",
  sectionsOrder: [
    "ticker",
    "hero",
    "games_catalog",
    "how_it_works",
    "features",
    "faq",
    "support_banner",
  ],
  sectionsVisibility: {
    ticker: true,
    hero: true,
    games_catalog: true,
    how_it_works: true,
    features: true,
    faq: true,
    support_banner: true,
  },
  hero: {
    badgeText: "វេទិកាបញ្ចូលពេជ្រហ្គេមស្វ័យប្រវត្តិកំពូលនៅកម្ពុជា",
    titlePrefix: "អាណាចក្រ",
    titleHighlight: "Diamond",
    titleSuffix: "កម្ពុជា",
    description:
      "បញ្ចូលពេជ្រ Mobile Legends, Free Fire, PUBG Mobile ភ្លាមៗ 24/7! ស្កេនទូទាត់ប្រាក់តាមរយៈ Bakong KHQR ទទួលពេជ្រក្នុងរយៈពេល 5 វិនាទី ដោយស្វ័យប្រវត្តិ។",
    ctaText: "បញ្ចូលពេជ្រ MLBB ឥឡូវនេះ",
    ctaLink: "/games/mobile-legends",
    secondaryBadgeText: "MooGold Live Reseller API",
    backgroundImageUrl: "/images/hero-bg.jpg",
    bgOpacity: 100,
    themeColor: "cyan",
    trustBadges: [
      { id: "tb1", icon: "Zap", text: "ចូលពេជ្រក្នុង 5 វិនាទី" },
      { id: "tb2", icon: "ShieldCheck", text: "100% គ្មានបាត់ Account" },
      { id: "tb3", icon: "Flame", text: "Bakong KHQR គ្រប់ធនាគារ" },
    ],
  },
  ticker: {
    enabled: true,
    label: "ការទិញចុងក្រោយ (Live Orders):",
    customItems: [
      "ProSlayer_KH 🇰🇭 ទើបតែទិញ 706 Diamonds (MLBB) តាម Bakong KHQR",
      "Vannak_Ace 🔥 ទើបតែទិញ Weekly Diamond Pass",
      "Sokha_Sniper 🎯 ទើបតែទិញ 660 UC (PUBG Mobile)",
      "Dara_Mythic 👑 ទើបតែទិញ 520 Diamonds (Free Fire)",
      "Bopha_Gamer 💎 ទើបតែទិញ 2,195 Diamonds (MLBB)",
    ],
  },
  gamesCatalog: {
    badge: "បញ្ជីហ្គេមទាំងអស់ (Game Catalogue)",
    title: "ជ្រើសរើសហ្គេមដែលអ្នកចង់បញ្ចូលពេជ្រ",
    subtitle: "គាំទ្រការទូទាត់តាម Bakong KHQR គ្រប់ហ្គេមទាំងអស់ដោយស្វ័យប្រវត្តិ",
    columns: 3,
    showSearchBar: true,
    featuredBadgeText: "ពេញនិយមបំផុត (Top 1)",
  },
  howItWorks: {
    badge: "របៀបបញ្ចូលពេជ្រងាយៗ",
    title: "បញ្ចូលពេជ្រត្រឹមតែ",
    titleHighlight: "3 ជំហានរហ័ស",
    subtitle: "ដំណើរការបញ្ចូលពេជ្រដោយស្វ័យប្រវត្តិ មិនត្រូវការ Password គណនីរបស់អ្នកឡើយ",
    steps: [
      {
        id: "step-1",
        stepNumber: "01",
        title: "ជ្រើសរើសហ្គេម & បញ្ចូល ID",
        description: "ជ្រើសរើសហ្គេមដែលអ្នកចូលចិត្ត រួចវាយបញ្ចូល User ID និង Zone ID ពីប្រវត្តិរូបហ្គេមរបស់អ្នក។",
        icon: "Gamepad2",
      },
      {
        id: "step-2",
        stepNumber: "02",
        title: "ជ្រើសរើសចំនួនពេជ្រ",
        description: "ជ្រើសរើសកញ្ចប់ពេជ្រដែលអ្នកពេញចិត្ត តម្លៃសមរម្យ និងមានប្រូម៉ូសិនថែមពេជ្រជាច្រើន។",
        icon: "Diamond",
      },
      {
        id: "step-3",
        stepNumber: "03",
        title: "ស្កេន KHQR & ទទួលភ្លាមៗ",
        description: "ស្កេនទូទាត់ជាមួយ App ធនាគារណាក៏បាន ពេជ្រនឹងចូលក្នុងគណនីហ្គេមភ្លាមៗក្នុង 5 វិនាទី!",
        icon: "Zap",
      },
    ],
  },
  whyChooseUs: {
    title: "ហេតុអ្វីជ្រើសរើស",
    titleHighlight: "អាណាចក្រDiamond",
    subtitle: "សេវាកម្មបញ្ចូលពេជ្រហ្គេមដែលទុកចិត្តបំផុតដោយអ្នកលេងហ្គេមខ្មែររាប់ពាន់នាក់ទូទាំងប្រទេស",
    features: [
      {
        id: "feat-1",
        icon: "Zap",
        title: "ចូលពេជ្រភ្លាមៗ (Instant Delivery)",
        description:
          "ភ្ជាប់ដោយផ្ទាល់ជាមួយ MooGold API ដោយស្វ័យប្រវត្តិ។ ពេលទូទាត់ប្រាក់រួចរាល់ ពេជ្រនឹងចូលក្នុងគណនីហ្គេមរបស់អ្នកភ្លាមៗក្នុងរយៈពេលត្រឹមតែប៉ុន្មានវិនាទី!",
      },
      {
        id: "feat-2",
        icon: "CreditCard",
        title: "Bakong KHQR គ្រប់ធនាគារ",
        description:
          "ស្កេនទូទាត់ប្រាក់តាមស្តង់ដារ KHQR ជាតិ មិនគិតថ្លៃសេវាបន្ថែម។ គាំទ្រ ABA Bank, ACLEDA, Wing, Canadia, Sathapana និងធនាគារជាសមាជិកបាគងទាំងអស់។",
      },
      {
        id: "feat-3",
        icon: "ShieldCheck",
        title: "សុវត្ថិភាព 100% គ្មានបាត់គណនី",
        description:
          "យើងត្រូវការតែ User ID និង Zone ID ប៉ុណ្ណោះ។ ដាច់ខាតមិនទាមទារ Password ឬ Login Account ឡើយ ដូច្នេះគណនីរបស់អ្នកមានសុវត្ថិភាព 100%។",
      },
    ],
  },
  faq: {
    badge: "សំណួរ-ចម្លើយ",
    title: "សំណួរដែលសួរញឹកញាប់",
    subtitle: "ស្វែងយល់បន្ថែមអំពីសេវាកម្ម និងរបៀបដោះស្រាយបញ្ហាផ្សេងៗ",
    items: [
      {
        id: "faq-1",
        question: "តើពេជ្រចូលក្នុងគណនីហ្គេមក្នុងរយៈពេលប៉ុន្មាន?",
        answer:
          "ជាទូទៅ ពេជ្រនឹងបញ្ចូលទៅក្នុងគណនីហ្គេមរបស់អ្នកភ្លាមៗក្នុងរយៈពេលត្រឹមតែ 5 ទៅ 30 វិនាទី បន្ទាប់ពីការទូទាត់តាម Bakong KHQR បានជោគជ័យ។",
      },
      {
        id: "faq-2",
        question: "តើខ្ញុំអាចទូទាត់ប្រាក់តាមរយៈធនាគារណាខ្លះ?",
        answer:
          "អ្នកអាចប្រើប្រាស់ Mobile Banking របស់គ្រប់ធនាគារទាំងអស់នៅកម្ពុជាដែលគាំទ្រ Bakong KHQR ដូចជា ABA Bank, ACLEDA, Wing, Canadia, Sathapana, TrueMoney, Chip Mong និងធនាគារដទៃទៀត។",
      },
      {
        id: "faq-3",
        question: "ចុះបើខ្ញុំបញ្ចូល User ID ខុស តើត្រូវធ្វើដូចម្តេច?",
        answer:
          "ប្រព័ន្ធរបស់យើងមានមុខងារផ្ទៀងផ្ទាត់ឈ្មោះហ្គេម (Nickname Verification) ដោយស្វ័យប្រវត្តិមុនពេលទូទាត់ប្រាក់។ សូមពិនិត្យមើលឈ្មោះឱ្យបានច្បាស់លាស់មុនពេលស្កេនទូទាត់។ ប្រសិនបើមានបញ្ហា សូមទាក់ទងមកកាន់ Telegram Support របស់យើងជាបន្ទាន់។",
      },
      {
        id: "faq-4",
        question: "តើការបញ្ចូលពេជ្រនៅទីនេះមានសុវត្ថិភាពដែរឬទេ?",
        answer:
          "សុវត្ថិភាព 100%! យើងជាដៃគូផ្លូវការជាមួយ MooGold API ហើយមិនដែលស្នើសុំលេខសម្ងាត់ (Password) នៃគណនីហ្គេមរបស់អ្នកឡើយ។",
      },
    ],
  },
  supportBanner: {
    enabled: true,
    badge: "ត្រូវការជំនួយបន្ថែម?",
    title: "ក្រុមការងារជំនួយបម្រើអតិថិជន 24 ម៉ោងលើ 24 ម៉ោង",
    description:
      "ប្រសិនបើអ្នកជួបបញ្ហាពេលបញ្ចូលពេជ្រ ឬមានចម្ងល់បន្ថែម សូមទាក់ទងមកកាន់ Telegram ជំនួយការផ្លូវការរបស់យើងបានគ្រប់ពេលវេលា។",
    telegramUsername: "@AnajakDiamondSupport",
    telegramLink: "https://t.me/AnajakDiamondSupport",
    buttonText: "ឆាតទៅកាន់ Telegram Support",
  },
};

export function mergeLandingConfig(partial?: Partial<LandingPageConfig> | null): LandingPageConfig {
  if (!partial) return DEFAULT_LANDING_CONFIG;

  return {
    ...DEFAULT_LANDING_CONFIG,
    ...partial,
    themeMode: partial.themeMode === "light" ? "light" : "dark",
    sectionsOrder:
      Array.isArray(partial.sectionsOrder) && partial.sectionsOrder.length > 0
        ? partial.sectionsOrder
        : DEFAULT_LANDING_CONFIG.sectionsOrder,
    sectionsVisibility: {
      ...DEFAULT_LANDING_CONFIG.sectionsVisibility,
      ...(partial.sectionsVisibility || {}),
    },
    hero: {
      ...DEFAULT_LANDING_CONFIG.hero,
      ...(partial.hero || {}),
      trustBadges: partial.hero?.trustBadges || DEFAULT_LANDING_CONFIG.hero.trustBadges,
    },
    ticker: {
      ...DEFAULT_LANDING_CONFIG.ticker,
      ...(partial.ticker || {}),
      customItems: partial.ticker?.customItems || DEFAULT_LANDING_CONFIG.ticker.customItems,
    },
    gamesCatalog: {
      ...DEFAULT_LANDING_CONFIG.gamesCatalog,
      ...(partial.gamesCatalog || {}),
    },
    howItWorks: {
      ...DEFAULT_LANDING_CONFIG.howItWorks,
      ...(partial.howItWorks || {}),
      steps: partial.howItWorks?.steps || DEFAULT_LANDING_CONFIG.howItWorks.steps,
    },
    whyChooseUs: {
      ...DEFAULT_LANDING_CONFIG.whyChooseUs,
      ...(partial.whyChooseUs || {}),
      features: partial.whyChooseUs?.features || DEFAULT_LANDING_CONFIG.whyChooseUs.features,
    },
    faq: {
      ...DEFAULT_LANDING_CONFIG.faq,
      ...(partial.faq || {}),
      items: partial.faq?.items || DEFAULT_LANDING_CONFIG.faq.items,
    },
    supportBanner: {
      ...DEFAULT_LANDING_CONFIG.supportBanner,
      ...(partial.supportBanner || {}),
    },
  };
}

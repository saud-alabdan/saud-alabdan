/*
 * Saud AlAbdan — Central Content & Configuration Source
 * =====================================================
 * SINGLE SOURCE OF TRUTH for everything editable on the site.
 * UI components READ from this object and own no copy of their own.
 *
 * Runtime: a plain browser script (no build step) that assigns `window.SITE`.
 * Every page loads this file in <helmet> before its component logic runs, so
 * the whole site renders from one object synchronously.
 *
 * ── CMS-READY CONTRACT ────────────────────────────────────────────────────
 * The `window.SITE` object below is the EXACT JSON shape a future Admin
 * Dashboard / headless CMS will emit. To connect a CMS later, the only change
 * is HOW this object is produced — replace the literal with a fetch/hydrate:
 *
 *     window.SITE = await fetch('/api/site-content').then(r => r.json());
 *
 * No component markup, no renderVals mapping, and no page changes are needed.
 * Keep this file the single integration seam.
 *
 * SECTION MAP (matches the Admin Dashboard's future editing groups):
 *   site        → brand / identity            seo       → per-site SEO metadata
 *   navigation  → header links + CTA          whatsapp  → WhatsApp channel
 *   content.*   → one key per page section    footer    → footer columns
 *   theme       → design tokens (rarely edited by content editors)
 * ──────────────────────────────────────────────────────────────────────────
 */
(function () {

  /* ── DESIGN TOKENS ─────────────────────────────────────────────────────
   * Not "content" — kept here so the whole visual system has one origin too.
   * A CMS would expose these only under an advanced "Theme" screen.        */
  const THEME = {
    color: {
      bg:        '#F7F5F2',
      surface:   '#FCFBF8',
      ink:       '#232323',
      body:      '#5F5951',
      muted:     '#8A837A',
      faint:     '#B7AFA3',
      line:      '#E6E0D8',
      lineSoft:  '#EDE8E1',
      primary:   '#48553F',
      primaryHover: '#394334',
      accent:    '#A57A4C',
      accentHover: '#8D673E',
      dark:      '#2A2A28',
      onDark:    '#FCFBF8',
      onDarkDim: '#C7C1B6'
    },
    font: {
      family: "'IBM Plex Sans Arabic', sans-serif",
      googleHref: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap'
    },
    numerals: 'western'
  };

  /* ── SITE / BRAND IDENTITY ─────────────────────────────────────────────*/
  const SITE = {
    name: 'سعود العبدان',
    tagline: 'استشارات استراتيجية لصناع القرار.',
    heroKicker: 'استشارات استراتيجية لصناع القرار',
    portrait: 'uploads/صورتي.png',
    email: 'contact@saudalabdan.com',
    phone: '',                                    // future-ready; hidden while empty
    location: 'الرياض، المملكة العربية السعودية',
    copyright: '© 2026 سعود العبدان',
    lang: 'ar',
    dir: 'rtl'
  };

  /* ── SEO METADATA ──────────────────────────────────────────────────────
   * Consumed by each page's <head> (title + meta). `pages` allows per-page
   * overrides keyed by page id; falls back to `default`.                   */
  const SEO = {
    default: {
      title: 'سعود العبدان — استشارات استراتيجية لصناع القرار',
      description: 'أعمل مع أصحاب الأعمال لتحويل التحديات إلى خطوات عملية قابلة للتنفيذ، وفرص للنمو والتحسين.',
      ogImage: 'uploads/صورتي.png'
    },
    pages: {
      home:       { title: 'سعود العبدان — استشارات استراتيجية لصناع القرار' },
      contact:    { title: 'تواصل — سعود العبدان' }
    }
  };

  /* ── WHATSAPP CHANNEL ──────────────────────────────────────────────────
   * `enabled` gates any WhatsApp UI. `link` is derived from the number and a
   * pre-filled message; components should read `link` and never rebuild it. */
  const WHATSAPP = (function () {
    const number = '966500000000';               // international format, no +
    const message = 'السلام عليكم، أود حجز استشارة.';
    return {
      enabled: true,
      number: number,
      message: message,
      link: 'https://wa.me/' + number + '?text=' + encodeURIComponent(message),
      buttonLabel: 'تواصل عبر واتساب',
      businessHours: 'الأحد – الخميس، ٩ ص – ٥ م',
      floating: {
        enabled: true,
        position: 'right',                        // 'right' | 'left'
        showOnAll: true,
        showOn: { home: true, contact: false }
      }
    };
  })();

  /* ── NAVIGATION ────────────────────────────────────────────────────────*/
  const NAVIGATION = {
    primary: [
      { label: 'الموضوعات', href: '#topics' },
      { label: 'كيف أعمل', href: '#how' },
      { label: 'لماذا أنا', href: '#why' }
    ],
    // Destination is the single consultation action (whatsapp), so the CTA
    // carries a label only — no per-CTA link to drift out of sync.
    cta: { label: 'احجز استشارة' }
  };

  /* ── FOOTER ────────────────────────────────────────────────────────────*/
  const FOOTER = {
    columns: [
      {
        title: 'التنقل',
        links: [
          { label: 'المنتجات', href: 'Products.dc.html' },
          { label: 'الدورات', href: 'Courses.dc.html' },
          { label: 'تواصل', href: 'Contact.dc.html' }
        ]
      },
      {
        title: 'قانوني',
        links: [
          { label: 'سياسة الخصوصية', href: 'Privacy.dc.html' },
          { label: 'شروط الاستخدام', href: 'Terms.dc.html' }
        ]
      }
    ]
  };

  /* ── FOOTER SOCIAL CHANNELS ────────────────────────────────────────────
   * `type` selects the outline icon. `hidden:true` hides a channel (absent =
   * visible). The email channel derives its address from SITE.email — the
   * single source — so the address lives in exactly one place.              */
  const SOCIAL = [
    { type: 'linkedin',  label: 'LinkedIn',  href: 'https://www.linkedin.com' },
    { type: 'x',         label: 'X',         href: 'https://x.com' },
    { type: 'instagram', label: 'Instagram', href: '', hidden: true },
    { type: 'email',     label: 'البريد' }
  ];

  /* ── PAGE CONTENT ──────────────────────────────────────────────────────
   * One key per homepage section, in visual order. Each is an independently
   * editable content group in the future Admin Dashboard.                  */
  const CONTENT = {

    // 1 — Hero
    hero: {
      titleLines: ['وضوح في القرار', 'قبل الحديث عن الحل'],
      body: 'أعمل مع أصحاب الأعمال لتحويل التحديات إلى خطوات عملية قابلة للتنفيذ، وفرص للنمو والتحسين.',
      cta: { label: 'احجز استشارتك', href: '#contact' }
    },

    // 2 — Consultation Topics
    topics: {
      title: 'ما القرار الذي تعمل عليه اليوم؟',
      body: 'أمثلة على بعض الموضوعات التي أعمل عليها. وإذا لم تجد حالتك هنا، فسنناقشها معًا.',
      cta: { label: 'احجز استشارتك', href: 'Contact.dc.html' },
      items: [
        { title: 'افتتاح مشروع جديد', desc: 'دراسة الجدوى والخطوات الأولى قبل الانطلاق.' },
        { title: 'التوسع وافتتاح الفروع', desc: 'توقيت التوسع واختيار المواقع بقرار مدروس.' },
        { title: 'تحسين التشغيل', desc: 'معالجة الاختناقات ورفع كفاءة العمليات اليومية.' },
        { title: 'رفع الربحية', desc: 'مراجعة التكاليف والتسعير وهوامش الربح.' },
        { title: 'إعادة هيكلة الأعمال', desc: 'إعادة ترتيب الأدوار والهيكل لدعم المرحلة القادمة.' },
        { title: 'تقييم فكرة أو فرصة استثمارية', desc: 'فحص الفرصة ومخاطرها قبل الالتزام بها.' },
        { title: 'تطوير تجربة العميل', desc: 'تحسين رحلة العميل ونقاط التواصل معه.' },
        { title: 'بناء خطة للنمو', desc: 'مسار واضح المعالم لتنمية العمل بثبات.' }
      ]
    },

    // 3 — Method / How it works
    how: {
      title: 'كيف تبدأ رحلتك؟',
      steps: [
        { num: '01', title: 'التواصل', desc: 'تحديد موعد مناسب لبدء الاستشارة.', icon: 'calendar', featured: false },
        { num: '02', title: 'المناقشة', desc: 'فهم التحدي والهدف ومناقشة تفاصيل الحالة.', icon: 'messages', featured: false },
        { num: '03', title: 'التوصيات', desc: 'الحصول على توصيات عملية وخطوات واضحة للتنفيذ.', icon: 'clipboard', featured: false },
        { num: '04', title: 'الدفع عند الاستفادة', desc: 'يتم الدفع فقط إذا قدمت الاستشارة قيمة حقيقية.', icon: 'handshake', featured: true }
      ]
    },

    // 4 — Impact in Numbers
    stats: {
      title: 'أرقام تعكس الخبرة',
      items: [
        { value: 15, suffix: '+', label: 'سنة خبرة' },
        { value: 200, suffix: '+', label: 'جهة تعاملت معها' },
        { value: 500, suffix: '+', label: 'جلسة استشارية' },
        { value: 30, suffix: '+', label: 'قطاعًا مختلفًا' }
      ]
    },

    // 5 — Why clients choose me
    why: {
      portrait: 'uploads/صورتي.png',
      statement: 'لماذا يختارني العملاء؟',
      body: 'أجمع بين النظرة التحليلية والخبرة الميدانية، لأساعدك على رؤية الصورة كاملة قبل اتخاذ القرار، بعيدًا عن الحلول العامة.',
      points: [
        { title: 'تحليل قبل التوصية', desc: 'كل رأي مبني على فهم دقيق لواقع عملك، لا على قوالب جاهزة.' },
        { title: 'حضور مباشر', desc: 'تعمل معي شخصيًا من أول جلسة حتى وضوح الخطوة التالية.' },
        { title: 'قرار قابل للتنفيذ', desc: 'مخرجات عملية تستطيع البدء بها فورًا، لا مجرد نظريات.' }
      ]
    },

    // 6 — Final CTA (shared, fully CMS-managed component — see config/site-chrome.js)
    closingCta: {
      enabled: true,                       // show / hide the whole section
      title: 'هل لديك قرار يحتاج إلى وضوح؟',
      body: 'احجز جلسة استشارية أولى وابدأ بخطوة واضحة نحو الحل.',
      button: {
        label: 'احجز استشارتك الآن',
        destinationType: 'whatsapp',       // whatsapp | email | internal | external
        destination: ''                    // used by internal (page) / external (url)
      },
      // Appearance — design tokens only (no hardcoded colours):
      background: 'primary',               // primary | secondary | light | dark | transparent
      textStyle: 'auto',                   // auto | light | dark
      buttonStyle: 'primary'               // primary | secondary | outline | ghost
    },

    // 7 — Organizations / logo wall (shared, fully CMS-managed — see config/site-chrome.js)
    // Reusable logo strip. Position on the Home page is chosen from the CMS via a
    // lightweight anchor selector (no section-ordering engine). No organization is
    // hardcoded — the list is managed entirely from the CMS.
    organizations: {
      enabled: true,                       // show / hide the whole section
      position: 'before-closing',          // after-hero | after-topics | after-stats | after-why | before-closing
      logoSize: 'medium',                  // small | medium | large (responsive; controls displayed logo size)
      title: 'جهات نفخر بالعمل معها',
      showTitle: true,                     // show / hide the title
      body: '',
      showDescription: false,              // show / hide the description
      items: []                            // { logo, name, url?, alt, order, hidden } — added from the CMS
    }
  };

  /* ── SERVICES ──────────────────────────────────────────────────────────
   * Managed by the CMS "إدارة الاستشارات" module. `services.consultations` is
   * the SINGLE SOURCE for every consultation card on the public site; each item
   * carries everything its card needs (price mode, badge, features, CTA). New
   * items appear automatically. products / courses back their own (separate)
   * CMS sections.                                                           */
  const SERVICES = {
    consultations: [
      {
        title: 'استشارة استراتيجية',
        description: 'جلسة لمراجعة وضعك الحالي وتحديد أولوياتك القادمة بوضوح.',
        priceType: 'fixed', price: 1500, currency: 'SAR', priceText: '', period: 'session',
        durationMinutes: 60,
        features: ['تشخيص شامل للوضع الحالي', 'تحديد الأولويات والفرص', 'خطة عمل أولية قابلة للتنفيذ'],
        badge: '', ctaLabel: 'احجز الآن', ctaHref: '',
        order: 1, active: true
      },
      {
        title: 'جلسة قرار مركّزة',
        description: 'جلسة سريعة لاتخاذ قرار محدد بثقة ووضوح.',
        priceType: 'fixed', price: 800, currency: 'SAR', priceText: '', period: 'session',
        durationMinutes: 30,
        features: ['تحليل الخيارات المتاحة', 'توصية واضحة ومباشرة'],
        badge: 'الأكثر طلبًا', ctaLabel: 'احجز الآن', ctaHref: '',
        order: 2, active: true
      },
      {
        title: 'برنامج مرافقة شهري',
        description: 'مرافقة مستمرة على مدار الشهر لتنفيذ الخطة خطوة بخطوة.',
        priceType: 'from', price: 5000, currency: 'SAR', priceText: '', period: 'month',
        durationMinutes: 0,
        features: ['جلسات أسبوعية منتظمة', 'دعم مستمر عبر الرسائل', 'مراجعة شهرية للنتائج'],
        badge: '', ctaLabel: 'تواصل معنا', ctaHref: 'Contact.dc.html',
        order: 3, active: true
      }
    ],
    products: [
      {
        title: 'قالب دراسة الجدوى',
        description: 'قالب جاهز لإعداد دراسة جدوى احترافية خطوة بخطوة.',
        cover: '', price: 199, currency: 'SAR', format: 'template', url: null,
        active: true
      },
      {
        title: 'دليل التسعير العملي',
        description: 'دليل عملي لبناء استراتيجية تسعير مربحة لمنتجاتك وخدماتك.',
        cover: '', price: 149, currency: 'SAR', format: 'pdf', url: null,
        active: true
      }
    ],
    courses: [
      {
        title: 'أساسيات اتخاذ القرار',
        description: 'دورة تدريبية في مهارات اتخاذ القرار الاستراتيجي بثقة ووضوح.',
        cover: '', durationHours: 6, level: 'beginner', price: 600, currency: 'SAR',
        active: true
      },
      {
        title: 'بناء نموذج عمل ناجح',
        description: 'ورشة عملية لتصميم نموذج عمل واضح وقابل للتنفيذ.',
        cover: '', durationHours: 8, level: 'intermediate', price: 900, currency: 'SAR',
        active: true
      }
    ]
  };

  /* ── PUBLIC OBJECT ─────────────────────────────────────────────────────
   * Backwards-compatible aliases (brand, contact) are derived from SITE so
   * existing component mappings keep working unchanged.                    */
  window.SITE = {
    theme: THEME,
    site: SITE,
    brand: { name: SITE.name, tagline: SITE.tagline, heroKicker: SITE.heroKicker, portrait: SITE.portrait },
    contact: { email: SITE.email, phone: SITE.phone, location: SITE.location, copyright: SITE.copyright },
    seo: SEO,
    whatsapp: WHATSAPP,
    navigation: NAVIGATION,
    footer: FOOTER,
    social: SOCIAL,
    content: CONTENT,
    services: SERVICES
  };
})();

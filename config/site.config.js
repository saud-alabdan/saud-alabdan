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
    tagline: 'التطوير والتحسين المستمر، وتوظيف الذكاء الاصطناعي في الأعمال.',
    heroKicker: 'التطوير والتحسين المستمر',
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
      title: 'سعود العبدان | التطوير والتحسين المستمر والذكاء الاصطناعي في الأعمال',
      description: 'أساعد المنشآت والجهات على تطوير أعمالها وتحسين عملياتها وتوظيف الذكاء الاصطناعي فيها، من واقع الممارسة.',
      ogImage: 'uploads/صورتي.png'
    },
    pages: {
      home:       { title: 'سعود العبدان | التطوير والتحسين المستمر والذكاء الاصطناعي في الأعمال' },
      contact:    { title: 'تواصل — سعود العبدان' }
    }
  };

  /* ── WHATSAPP CHANNEL ──────────────────────────────────────────────────
   * `enabled` gates any WhatsApp UI. `link` is derived from the number and a
   * pre-filled message; components should read `link` and never rebuild it. */
  const WHATSAPP = (function () {
    const number = '966542220291';               // international format, no +
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

  // Pre-filled WhatsApp link for a specific service, so each message names it.
  const waTo = (m) => 'https://wa.me/' + WHATSAPP.number + '?text=' + encodeURIComponent(m);

  /* ── NAVIGATION ────────────────────────────────────────────────────────*/
  const NAVIGATION = {
    primary: [
      { label: 'الموضوعات', href: '#topics' },
      { label: 'كيف أعمل', href: '#how' },
      { label: 'لماذا أنا', href: '#why' },
      { label: 'المقالات', href: 'Articles.dc.html' }
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
          { label: 'المقالات', href: 'Articles.dc.html' },
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
    { type: 'x',         label: 'X',         href: 'https://x.com/Saudalabdan' },
    { type: 'instagram', label: 'Instagram', href: '', hidden: true },
    { type: 'email',     label: 'البريد' }
  ];

  /* ── PAGE CONTENT ──────────────────────────────────────────────────────
   * One key per homepage section, in visual order. Each is an independently
   * editable content group in the future Admin Dashboard.                  */
  const CONTENT = {

    // 1 — Hero
    hero: {
      titleLines: ['أعمال أقل هدرًا', 'ونتائج أوضح'],
      body: 'أساعد المنشآت والجهات على تطوير أعمالها وتحسين عملياتها وتوظيف الذكاء الاصطناعي فيها، من واقع الممارسة.',
      cta: { label: 'احجز استشارتك', href: '#contact' },
      portraitScale: 100                          // Hero portrait size, percent (70–200). 100 = default.
    },

    // 2 — Consultation Topics
    topics: {
      title: 'ما الذي تريد تطويره اليوم؟',
      body: 'أمثلة على ما أعمل عليه مع المنشآت والجهات. وإن لم تجد حالتك هنا، نناقشها معًا.',
      cta: { label: 'احجز استشارتك', href: 'Contact.dc.html' },
      items: [
        { title: 'بناء خطة للنمو', desc: 'مسار واضح لتنمية عملك بثبات.' },
        { title: 'تقييم فكرة أو فرصة', desc: 'فحص الجدوى والمخاطر قبل الالتزام.' },
        { title: 'تحسين الإجراءات', desc: 'تشخيص مسار العمل قبل أتمتته أو تغيير نظامه.' },
        { title: 'رفع كفاءة التشغيل', desc: 'معالجة الاختناقات وإزالة الهدر في العمل اليومي.' },
        { title: 'توظيف الذكاء الاصطناعي', desc: 'اختيار الاستخدامات التي تضيف قيمة حقيقية لعملك.' },
        { title: 'الجاهزية للتحول الرقمي', desc: 'مواءمة الإجراءات والبيانات قبل الأتمتة.' },
        { title: 'مراجعة المنصات الإلكترونية', desc: 'دراسة المنصة وتجربتها وتشغيلها، وتوصيات للتطوير.' },
        { title: 'الهوية والمحتوى المؤسسي', desc: 'مراجعة الهوية المؤسسية، ومحتوى القيادات، والحقائب التدريبية.' }
      ]
    },

    // 3 — Method / How it works
    how: {
      title: 'كيف تبدأ رحلتك؟',
      steps: [
        { num: '01', title: 'التواصل', desc: 'تحديد موعد مناسب لبدء الاستشارة.', icon: 'calendar', featured: false },
        { num: '02', title: 'المناقشة', desc: 'فهم التحدي والهدف ومناقشة تفاصيل الحالة.', icon: 'messages', featured: false },
        { num: '03', title: 'التوصيات', desc: 'الحصول على توصيات عملية وخطوات واضحة للتنفيذ.', icon: 'clipboard', featured: false },
        { num: '04', title: 'الدفع عند الاستفادة', desc: 'تدفع بعد الجلسة، إذا وجدت فيها قيمة حقيقية.', icon: 'handshake', featured: true }
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
      body: 'أجمع بين الممارسة الميدانية والمنهج والتقنية، لأساعدك على رؤية عملك كاملًا قبل أن تقرر.',
      points: [
        { title: 'من الميدان إلى المنهج', desc: 'درّبت على كايزن داخل المملكة وخارجها، وطبّقته سنوات في نشاط تجاري.' },
        { title: 'الإجراء والتقنية معًا', desc: 'خبرتي في البنية المؤسسية تجعلني أرى الإجراء والنظام والبيانات صورة واحدة.' },
        { title: 'ذكاء اصطناعي بانضباط', desc: 'أوظّفه في عملي كل يوم، وأقيس أثره قبل أن أوصي به.' }
      ]
    },

    // 6 — Final CTA (shared, fully CMS-managed component — see config/site-chrome.js)
    closingCta: {
      enabled: true,                       // show / hide the whole section
      title: 'ما الخطوة التالية في عملك؟',
      body: 'احجز استشارتك، ونحدد معًا أول خطوة للتطوير.',
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
    },

    // 8 — Latest Articles (homepage section; renders via config/content-cards.js)
    latestArticles: {
      enabled: true,                       // show / hide the section
      title: 'أحدث المقالات',
      viewAllLabel: 'عرض كل المقالات'      // label of the button linking to Articles.dc.html
    },

    // 9 — Section Dividers (reusable premium transition system — see
    // config/section-dividers.js). Refines the flow BETWEEN existing sections;
    // adds/removes no section. Fully CMS-managed. Values here are the defaults
    // and MUST match config/section-dividers.js DEFAULTS so the look is identical
    // whether or not a value was saved.
    sectionDividers: {
      enabled: true,                       // show / hide the whole system (off = original layout)
      style: 'A',                          // A: minimal line · B: geometric scale · C: soft glow
      opacity: 100,                        // overall presence (0–100%)
      thickness: 1,                        // hairline / mark weight (px)
      accentIntensity: 55,                 // olive saturation of the lines (0–100%)
      ornament: true,                      // show / hide the centered ornament
      density: 3,                          // number of ornamental marks / ticks / glow layers
      spacingTop: 56,                      // space above the divider (px)
      spacingBottom: 56                    // space below the divider (px)
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
        title: 'استشارة تطوير وتقنية',
        description: 'جلسة نشخّص فيها عملك معًا: أين الهدر، وما الذي يستحق التطوير، وأين يضيف الذكاء الاصطناعي قيمة.',
        priceType: 'fixed', price: 650, compareAtPrice: '', currency: 'SAR', priceText: '', period: 'session',
        hidePrice: false, taxNote: false,
        durationMinutes: 60,
        features: ['تشخيص الإجراءات ومواضع الهدر', 'اختيار أدوات الذكاء الاصطناعي المناسبة لعملك', 'ملخص مكتوب بالخطوات يصلك خلال 48 ساعة', 'تدفع بعد الجلسة إذا وجدت فيها فائدة'],
        badgeType: 'none', badge: '', discountText: '', offerExpiry: '',
        ctaLabel: 'احجز الآن', ctaHref: waTo('السلام عليكم، أود حجز استشارة تطوير وتقنية.'),
        order: 1, status: 'available', active: true
      },
      {
        title: 'مراجعة منصة أو موقع',
        description: 'قراءة متخصصة لمنصتك أو موقعك من زاوية المستخدم والتشغيل، مع توصيات مرتبة بالأولوية.',
        priceType: 'fixed', price: 850, compareAtPrice: '', currency: 'SAR', priceText: '', period: 'once',
        hidePrice: false, taxNote: false,
        durationMinutes: 0,
        features: ['تجربة المستخدم ورحلة العميل', 'المحتوى والهوية والتصميم', 'تقرير مكتوب خلال 5 أيام عمل', 'حتى 10 صفحات أو شاشات', 'تدفع بعد التقرير إذا وجدت فيه فائدة'],
        badgeType: 'none', badge: '', discountText: '', offerExpiry: '',
        ctaLabel: 'اطلب المراجعة', ctaHref: waTo('السلام عليكم، أود طلب مراجعة منصة أو موقع.'),
        order: 2, status: 'available', active: true
      },
      {
        title: 'للجهات والمشاريع الأكبر',
        description: 'برنامج تطوير شهري، أو مراجعة شاملة، أو مراجعة الهوية المؤسسية والحقائب التدريبية ومحتوى القيادات.',
        priceType: 'custom', price: '', compareAtPrice: '', currency: 'SAR', priceText: 'عرض سعر رسمي', period: 'once',
        hidePrice: false, taxNote: false,
        durationMinutes: 0,
        features: ['نطاق وجدول زمني مكتوبان', 'عرض فني ومالي للجهات الحكومية والشركات', 'متابعة وقياس للأثر'],
        badgeType: 'none', badge: '', discountText: '', offerExpiry: '',
        ctaLabel: 'اطلب عرض سعر', ctaHref: waTo('السلام عليكم، أود طلب عرض سعر لجهتنا.'),
        order: 3, status: 'available', active: true
      }
    ],
    products: [
      {
        title: 'قالب دراسة الجدوى',
        description: 'قالب جاهز لإعداد دراسة جدوى احترافية خطوة بخطوة.',
        cover: '', price: 199, currency: 'SAR', format: 'template', url: null,
        active: false
      },
      {
        title: 'دليل التسعير العملي',
        description: 'دليل عملي لبناء استراتيجية تسعير مربحة لمنتجاتك وخدماتك.',
        cover: '', price: 149, currency: 'SAR', format: 'pdf', url: null,
        active: false
      }
    ],
    courses: [
      {
        title: 'أساسيات اتخاذ القرار',
        description: 'دورة تدريبية في مهارات اتخاذ القرار الاستراتيجي بثقة ووضوح.',
        cover: '', durationHours: 6, level: 'beginner', price: 600, currency: 'SAR',
        active: false
      },
      {
        title: 'بناء نموذج عمل ناجح',
        description: 'ورشة عملية لتصميم نموذج عمل واضح وقابل للتنفيذ.',
        cover: '', durationHours: 8, level: 'intermediate', price: 900, currency: 'SAR',
        active: false
      }
    ]
  };

  /* ── ARTICLES / BLOG ───────────────────────────────────────────────────
   * Managed by the CMS "المقالات" module. Each item: { cover, shareImage, title,
   * slug, summary, body(HTML), author, date, updated, published, featured,
   * cta{enabled,title,description,buttonText,buttonUrl}, seoTitle,
   * seoDescription, seoKeywords }. The single source for every article surface (homepage
   * "Latest Articles", the Articles page, and each Article page). Empty by
   * default — no article is hardcoded.                                      */
  const ARTICLES = [
    {
      "cover": "uploads/ai-waste-cover.jpg",
      "shareImage": "uploads/ai-waste-share.png",
      "title": "لماذا يخلّف الذكاء الاصطناعي هدرًا، وكيف تتخلص منه؟",
      "slug": "ai-waste",
      "summary": "السرعة التي يمنحها الذكاء الاصطناعي تخلّف بقايا لا نراها، وكايزن يعلّمنا كيف نراها ونزيلها.",
      "body": "<p><strong>«هل محتاجين كل هذي الملفات؟»</strong></p> <p>كتبت هذا السؤال للمساعد الذكي في آخر يوم من سبتمبر، بعد أن وصلني تنبيه بأن مساحة التخزين توشك أن تمتلئ. كنت أعمل معه على فيلم قصير، وطلبت منه أن يراجع مجلد المشروع ويحذف الهدر.</p> <p>جاءني الرد بملفين بحجم 624 ميغابايت لكل منهما، في مجلدين مختلفين، وبعد المقارنة تبيّن أنهما نسخة واحدة متطابقة حتى آخر بايت. وحولهما مسودات تجاوزتها نسخ أحدث، وتصديرات تجريبية لعشر ثوانٍ، وملفات صوت محفوظة أصلًا داخل الفيديوهات.</p> <p>شعرت بحرج صغير. أمضيت سنوات أدرّب الناس على مطاردة الهدر، وتراكم عندي ثلاثة غيغابايت منه دون أن أنتبه. كانت عيني على ما أنتجه، وغابت عمّا يتركه الإنتاج خلفه.</p> <p>من هنا رجعت إلى سجلات عملي مع الذكاء الاصطناعي في الأسابيع الماضية، فوجدت ثلاثة أنواع من الهدر تتكرر بانتظام.</p> <h2>لماذا يكثر الهدر مع الذكاء الاصطناعي؟</h2> <p>كايزن كلمة يابانية معناها «التغيير نحو الأحسن»، ومنهج في التحسين المستمر يقوم على إزالة ما لا يضيف قيمة، خطوة صغيرة بعد خطوة. درّبت عليه سنوات، ثم طبّقته في نشاطي التجاري.</p> <p>والذكاء الاصطناعي جعل الإنتاج سريعًا ورخيصًا؛ نسخة جديدة في دقيقة، وميزة إضافية بسطر واحد من الطلب. وكلما رخص الإنتاج، كثرت بقاياه، واحتاجت عينًا تراها.</p> <p>وهذه الملاحظة تؤيدها دراسة نشرتها هارفارد بزنس ريفيو في سبتمبر 2025، أجرتها مختبرات BetterUp مع جامعة ستانفورد: 41% من الموظفين صادفوا في عملهم مخرجات ذكاء اصطناعي تبدو مصقولة وتفتقر إلى المضمون، وكل حالة منها كلّفت قرابة ساعتين من إعادة العمل. أي أن الهدر الذي لا نراه عندنا، قد يصل إلى مكتب غيرنا.</p> <h2>ثلاثة أنواع من الهدر</h2> <p>يصنّف «الإنتاج الرشيق» (Lean)، وهو الاسم الذي عُرف به منهج تويوتا خارج اليابان، الهدر في ثمانية أنواع. ثلاثة منها ظهرت في سجلاتي أكثر من غيرها.</p> <p><strong>أولًا: زيادة الإنتاج.</strong> المساعد كريم أكثر من اللازم، يضيف ما لم يُطلب منه. في منصة محتوى أعمل عليها، تضخّمت قائمة التنقّل حتى بلغت سبع عشرة وجهة. بعد المراجعة صارت ست وجهات، وبقيت كل القدرات كما هي، وحُذف في تلك الجولة أكثر من أربعة آلاف سطر برمجي. وفي عمل الموظف اليومي يأخذ هذا الهدر شكل خمس مسودات لتقرير واحد، أو عرض تضخّم إلى ثلاثين شريحة لأن المساعد اقترح المزيد.</p> <p><strong>ثانيًا: المعالجة الزائدة.</strong> أن تكلّف المساعد بعمل تؤديه أداة أبسط منه. في نظام لتحليل الإجراءات أبنيه، كلّف أول تشغيل فعلي 8.73 دولارات، ذهب 66% منها على مخرجات انقطعت قبل أن تكتمل. وكشف التحليل أن 79% مما يُرسل للنموذج كان نتائج مراحل سابقة يُعاد إرسالها، أشبه بأن ترفق الملف كاملًا في كل رسالة بدل أن تشير إليه. بعد أربع دورات تحسين، قدّرنا انخفاض كلفة الإجراء بنحو 70%.</p> <p>قد يبدو المبلغ صغيرًا، لكنه كلفة تجربة واحدة. ولو تصوّرنا جهة تحلّل مئات الإجراءات بالطريقة نفسها، لصار هذا الهدر بندًا يُرى في الميزانية. وفي المكاتب يظهر النوع نفسه حين نطلب من المساعد تلخيص جدول يكفيه فرز بنقرة، أو صياغة رد يكفيه سطران.</p> <p>وفي هذه الجولة بالذات وقفت على أطرف ما في السجلات: المساعد نفسه كتب في أكثر من موضع «هذا خطئي»، ثم اقترح القاعدة التي تمنع تكراره. اعتراف بلا تبرير، يتبعه إصلاح مكتوب. وتساءلت حينها: كم فريقًا نعرفه يقول أفراده «هذا خطئي» بهذه البساطة، ثم يكتبون ما يمنع تكراره؟</p> <blockquote><strong>كم فريقًا نعرفه يقول أفراده «هذا خطئي» بهذه البساطة؟</strong></blockquote> <p><strong>ثالثًا: المخزون.</strong> نسخ الفيديو المتراكمة مثال واضح. ومثال آخر أقرب إليّ: عمل دورات التحسين نفسها بقي أسابيع دون حفظ في سجل الإصدارات، أي الأرشيف الذي يحفظ كل نسخة من العمل وتاريخها. عمل منجز لم يُسلَّم، واكتشافه صار دورة تحسين جديدة. وعند أغلبنا يأخذ المخزون شكل محادثات مفتوحة ومسودات متناثرة لم يُعتمد منها شيء.</p> <h2>من الخطأ إلى القاعدة</h2> <p>تعلّمت من كايزن أن التحسين الذي لا يُكتب يضيع مع أول انشغال. لذلك صار كل هدر نكتشفه يتحول إلى قاعدة مكتوبة يقرؤها المساعد في بداية كل جلسة.</p> <p>بعضها بسيط: يُفحص الاتصال قبل أي تشغيل مدفوع، وكل رقم في تقرير يُحسب من ملف النتائج مباشرة. وأقربها إليّ مبدأ خرجنا به من دورات التحليل: <strong>الكود يملك الحقائق، والنموذج يملك الحكم.</strong> ما يمكن حسابه بقاعدة ثابتة يتولاه البرنامج، ويتفرغ المساعد لما يحتاج فهمًا وتقديرًا.</p> <p>هذه دورة كايزن كما عرفتها منذ سنوات، وطرفها الآخر اليوم أداة تلتزم بالقاعدة متى كُتبت لها.</p> <h2>جرّبها في عملك القادم</h2> <p>حين تنتهي من أي عمل أنجزته مع الذكاء الاصطناعي، تقريرًا كان أو عرضًا أو برنامجًا، انسخ له هذه الجملة قبل أن تغلق:</p> <blockquote>راجع ما أنجزناه اليوم: ما الذي أنتجناه ولا نحتاجه؟ اقترح ما يُحذف، وانتظر موافقتي قبل الحذف.</blockquote> <p>ثم اختر ملاحظة واحدة مما وجده، واكتبها قاعدة في أول رسالة من عملك التالي. عشر دقائق في نهاية المهمة، وأثرها يظهر في المهمة التي بعدها.</p> <h2>العين التي ترى البقايا</h2> <p>في ذلك الصباح تعلّمت أن عيني تحتاج تدريبًا جديدًا. العين التي كانت تلاحظ الهدر بين المخزون والطلبات، صارت تبحث اليوم عن ملف مكرر أو ميزة لم يطلبها أحد. تغيّرت الأدوات، وبقي السؤال الياباني القديم كما هو: أين الهدر هنا؟</p> <p><strong>الذكاء الاصطناعي يمنحنا سرعة لم نعرفها من قبل، وكايزن يمنحنا العين التي ترى ما تخلّفه. ولننتبه.. فإن العجلة تُكثر الزوائد، والأناة تُبقي الفوائد.</strong></p> <p><small>المرجع: Niederhoffer وآخرون، <a href=\"https://hbr.org/2025/09/ai-generated-workslop-is-destroying-productivity\" target=\"_blank\" rel=\"noopener\">AI-Generated \"Workslop\" Is Destroying Productivity</a>، هارفارد بزنس ريفيو، 22 سبتمبر 2025.</small></p>",
      "author": "سعود بن راشد العبدان",
      "date": "2026-10-10",
      "updated": "",
      "published": false,
      "featured": true,
      "cta": {
        "enabled": true,
        "title": "هل في عملك هدر لا تراه؟",
        "description": "احجز استشارة تطوير وتقنية، ونحدد معًا أول خطوة للتحسين.",
        "buttonText": "احجز استشارتك",
        "buttonUrl": waTo("السلام عليكم، قرأت مقال الهدر وأود حجز استشارة.")
      },
      "seoTitle": "الهدر الذي يخلّفه الذكاء الاصطناعي وكيف تتخلص منه",
      "seoDescription": "ثلاثة أنواع من الهدر يخلّفها العمل مع الذكاء الاصطناعي، من واقع الممارسة، وطريقة كايزن للتخلص منها.",
      "seoKeywords": "كايزن، الذكاء الاصطناعي، الهدر، التحسين المستمر، الإنتاج الرشيق"
    }
  ];

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
    services: SERVICES,
    articles: ARTICLES
  };
})();

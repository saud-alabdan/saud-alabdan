/*
 * schema.js — declarative model of every editable section
 * ==============================================================
 * The form engine (form-engine.js) renders these; the shell (app.js) lists
 * them. Two groups today: "محتوى الموقع" (the existing window.SITE model) and
 * "الخدمات" (a NEW services model that lives under doc.services — not yet
 * consumed by the public site).
 *
 * Each section binds under `base` (a document path). `dirtyPath` (optional)
 * is the subtree compared for the sidebar "unsaved" dot when it differs from
 * `base` — used where several sections share a base (the services collections
 * all live under `services`).
 */
window.CMS_SCHEMA = (function () {
  'use strict';

  var CURRENCY = [['SAR', 'ريال (SAR)'], ['USD', 'دولار (USD)']];
  var PRICE_TYPE = [['fixed', 'سعر ثابت'], ['from', 'يبدأ من'], ['contact', 'تواصل لمعرفة السعر'], ['custom', 'نص مخصص']];
  var PERIOD = [['session', 'لكل جلسة'], ['month', 'شهري'], ['once', 'مرة واحدة']];
  var ICONS = [['calendar', 'تقويم'], ['messages', 'محادثة'], ['clipboard', 'قائمة'], ['handshake', 'مصافحة']];
  var SOCIAL_TYPES = [['linkedin', 'LinkedIn'], ['x', 'X'], ['instagram', 'Instagram'], ['email', 'البريد']];
  // Closing CTA option sets — appearance values map to the site's design tokens
  // (no free colour input); destination selects where the button points.
  var CTA_DEST = [['whatsapp', 'واتساب'], ['email', 'البريد الإلكتروني'], ['internal', 'صفحة داخلية'], ['external', 'رابط خارجي']];
  var CTA_BG = [['primary', 'أساسي'], ['secondary', 'ثانوي'], ['light', 'فاتح'], ['dark', 'داكن'], ['transparent', 'شفاف']];
  var CTA_TEXT = [['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']];
  var CTA_BTN = [['primary', 'أساسي'], ['secondary', 'ثانوي'], ['outline', 'محدد'], ['ghost', 'شبح']];
  // Organizations section — the lightweight anchor points it can occupy on the
  // Home page (no section-ordering engine; each maps to a slot in Home.dc.html).
  var ORG_POS = [['after-hero', 'أسفل الواجهة'], ['after-topics', 'بعد الموضوعات'], ['after-stats', 'بعد الأرقام'], ['after-why', 'بعد «لماذا أنا»'], ['before-closing', 'قبل الدعوة الختامية']];
  // Organizations logo size — maps to responsive dimensions in site-chrome.js.
  var ORG_SIZE = [['small', 'صغير'], ['medium', 'متوسط'], ['large', 'كبير'], ['xlarge', 'كبير جدًا']];
  var CTA = { type: 'group', key: 'cta', label: 'زر الإجراء', fields: [
    { type: 'text', key: 'label', label: 'النص' },
    { type: 'text', key: 'href', label: 'الرابط' }
  ] };

  var GROUPS = [
    { id: 'content', label: 'محتوى الموقع' },
    { id: 'services', label: 'الخدمات' },
    { id: 'blog', label: 'المدونة' }
  ];

  // Default shape for the (new) services model when the loaded document has none.
  var SERVICES_DEFAULT = { consultations: [], products: [], courses: [] };

  var SECTIONS = [

    /* ═══ WEBSITE CONTENT ═══════════════════════════════════════════════ */
    { id: 'site', group: 'content', label: 'الهوية والعلامة',
      desc: 'اسم العلامة، الوصف، وسائل التواصل الأساسية، والصورة الشخصية.', base: 'site', fields: [
      { type: 'text', key: 'name', label: 'اسم العلامة', required: true, hint: 'يظهر في الشريط العلوي وفي التذييل.' },
      { type: 'textarea', key: 'tagline', label: 'الوصف المختصر', hint: 'جملة تعريفية قصيرة تظهر في التذييل.' },
      { type: 'text', key: 'heroKicker', label: 'العنوان التمهيدي', hint: 'نص صغير يظهر أعلى عنوان الواجهة.' },
      { type: 'email', key: 'email', label: 'البريد الإلكتروني', required: true, hint: 'المصدر الوحيد للبريد — يظهر في التذييل وصفحات التواصل تلقائيًا.' },
      { type: 'text', key: 'phone', label: 'رقم الهاتف', hint: 'اختياري — يظهر في التذييل عند إضافته، ويبقى مخفيًا إذا تُرك فارغًا.' },
      { type: 'text', key: 'location', label: 'العنوان' },
      { type: 'text', key: 'copyright', label: 'حقوق النشر' },
      { type: 'image', key: 'portrait', label: 'الصورة الشخصية',
        recommended: 'صورة عمودية، ~1200×1500 بكسل', formats: ['JPG', 'PNG', 'WebP', 'SVG'], maxSize: 4194304,
        hint: 'تظهر في الواجهة الرئيسية للموقع.' },
      { type: 'select', key: 'lang', label: 'اللغة', options: [['ar', 'العربية'], ['en', 'English']] },
      { type: 'select', key: 'dir', label: 'اتجاه الكتابة', options: [['rtl', 'من اليمين لليسار (RTL)'], ['ltr', 'من اليسار لليمين (LTR)']] }
    ] },

    { id: 'seo', group: 'content', label: 'تحسين محركات البحث', desc: 'العناوين والأوصاف التعريفية.', base: 'seo', fields: [
      { type: 'group', key: 'default', label: 'الإعداد الافتراضي', fields: [
        { type: 'text', key: 'title', label: 'العنوان', required: true },
        { type: 'textarea', key: 'description', label: 'الوصف' },
        { type: 'image', key: 'ogImage', label: 'صورة المشاركة (OG)',
          recommended: '1200×630 بكسل', formats: ['JPG', 'PNG', 'WebP'], maxSize: 2097152,
          hint: 'تظهر عند مشاركة رابط الموقع على وسائل التواصل.' }
      ] },
      { type: 'group', key: 'pages', label: 'عناوين الصفحات', fields: [
        { type: 'group', key: 'home', label: 'الرئيسية', fields: [{ type: 'text', key: 'title', label: 'العنوان' }] },
        { type: 'group', key: 'contact', label: 'تواصل', fields: [{ type: 'text', key: 'title', label: 'العنوان' }] }
      ] }
    ] },

    { id: 'navigation', group: 'content', label: 'القائمة الرئيسية', desc: 'روابط الشريط العلوي وزر الحجز.', base: 'navigation', fields: [
      { type: 'list', key: 'primary', label: 'روابط القائمة', itemLabel: 'رابط', addLabel: 'إضافة رابط', titleKey: 'label', fields: [
        { type: 'text', key: 'label', label: 'النص', required: true },
        { type: 'text', key: 'href', label: 'الرابط', required: true }
      ] },
      { type: 'group', key: 'cta', label: 'زر الحجز', fields: [
        { type: 'text', key: 'label', label: 'النص', hint: 'الوجهة هي إجراء الحجز الموحّد (واتساب) المُدار من قسم إعدادات واتساب.' }
      ] }
    ] },

    { id: 'whatsapp', group: 'content', label: 'إعدادات واتساب', desc: 'المصدر الموحّد لكل ما يخص واتساب في الموقع (الأزرار والزر العائم).', base: 'whatsapp', fields: [
      { type: 'checkbox', key: 'enabled', label: 'تفعيل واتساب (للأزرار والروابط)' },
      { type: 'text', key: 'number', label: 'رقم واتساب (صيغة دولية بدون +)', hint: 'مثال: 966500000000' },
      { type: 'textarea', key: 'message', label: 'الرسالة الافتراضية', hint: 'تُرفق تلقائيًا مع الرابط.' },
      { type: 'text', key: 'buttonLabel', label: 'نص الزر', hint: 'مثال: تواصل عبر واتساب' },
      { type: 'text', key: 'businessHours', label: 'ساعات العمل (اختياري)', hint: 'تظهر كتلميح على الزر العائم.' },
      { type: 'group', key: 'floating', label: 'الزر العائم', fields: [
        { type: 'checkbox', key: 'enabled', label: 'إظهار الزر العائم' },
        { type: 'select', key: 'position', label: 'موضع الزر', options: [['right', 'يمين'], ['left', 'يسار']] },
        { type: 'checkbox', key: 'showOnAll', label: 'إظهار في جميع الصفحات' },
        { type: 'group', key: 'showOn', label: 'صفحات محددة (عند إلغاء «جميع الصفحات»)', fields: [
          { type: 'checkbox', key: 'home', label: 'الرئيسية' },
          { type: 'checkbox', key: 'contact', label: 'تواصل' }
        ] }
      ] }
    ] },

    { id: 'hero', group: 'content', label: 'الواجهة (Hero)', desc: 'العنوان الرئيسي أعلى الصفحة.', base: 'content.hero', fields: [
      { type: 'text', key: 'titleLines.0', label: 'العنوان — السطر الأول', required: true },
      { type: 'text', key: 'titleLines.1', label: 'العنوان — السطر الثاني' },
      { type: 'textarea', key: 'body', label: 'النص التعريفي' },
      CTA,
      { type: 'range', key: 'portraitScale', label: 'حجم الصورة الشخصية', min: 70, max: 200, step: 1, default: 100, suffix: '%',
        hint: 'يتحكم في حجم الصورة الشخصية في الواجهة (٧٠٪ – ٢٠٠٪). القيمة الافتراضية ١٠٠٪. يتكيّف تلقائيًا مع جميع الأحجام دون الإخلال بالتنسيق.' }
    ] },

    { id: 'topics', group: 'content', label: 'الموضوعات', desc: 'بطاقات القرارات التي تعمل عليها.', base: 'content.topics', fields: [
      { type: 'text', key: 'title', label: 'العنوان' },
      { type: 'textarea', key: 'body', label: 'النص' },
      CTA,
      { type: 'list', key: 'items', label: 'البطاقات', itemLabel: 'موضوع', addLabel: 'إضافة موضوع', titleKey: 'title', fields: [
        { type: 'text', key: 'title', label: 'العنوان', required: true },
        { type: 'textarea', key: 'desc', label: 'الوصف' }
      ] }
    ] },

    { id: 'method', group: 'content', label: 'كيف أعمل', desc: 'خطوات بدء الرحلة.', base: 'content.how', fields: [
      { type: 'text', key: 'title', label: 'العنوان' },
      { type: 'list', key: 'steps', label: 'الخطوات', itemLabel: 'خطوة', addLabel: 'إضافة خطوة', titleKey: 'title', fields: [
        { type: 'text', key: 'num', label: 'الرقم', hint: 'مثل 01' },
        { type: 'text', key: 'title', label: 'العنوان', required: true },
        { type: 'textarea', key: 'desc', label: 'الوصف' },
        { type: 'select', key: 'icon', label: 'الأيقونة', options: ICONS },
        { type: 'checkbox', key: 'featured', label: 'خطوة مميّزة' }
      ] }
    ] },

    { id: 'stats', group: 'content', label: 'الأرقام', desc: 'أرقام تعكس الخبرة.', base: 'content.stats', fields: [
      { type: 'text', key: 'title', label: 'العنوان' },
      { type: 'list', key: 'items', label: 'الأرقام', itemLabel: 'رقم', addLabel: 'إضافة رقم', titleKey: 'label', fields: [
        { type: 'number', key: 'value', label: 'القيمة', required: true },
        { type: 'text', key: 'suffix', label: 'اللاحقة', hint: 'مثل + أو %' },
        { type: 'text', key: 'label', label: 'التسمية', required: true }
      ] }
    ] },

    { id: 'why', group: 'content', label: 'لماذا أنا', desc: 'أسباب اختيار العملاء لك.', base: 'content.why', fields: [
      { type: 'text', key: 'statement', label: 'العنوان' },
      { type: 'textarea', key: 'body', label: 'النص' },
      { type: 'image', key: 'portrait', label: 'صورة القسم',
        recommended: 'صورة عمودية، ~1000×1250 بكسل', formats: ['JPG', 'PNG', 'WebP'], maxSize: 4194304 },
      { type: 'list', key: 'points', label: 'النقاط', itemLabel: 'نقطة', addLabel: 'إضافة نقطة', titleKey: 'title', fields: [
        { type: 'text', key: 'title', label: 'العنوان', required: true },
        { type: 'textarea', key: 'desc', label: 'الوصف' }
      ] }
    ] },

    { id: 'closing', group: 'content', label: 'الدعوة الختامية', desc: 'قسم الحث على الحجز في نهاية الصفحة.', base: 'content.closingCta', fields: [
      { type: 'checkbox', key: 'enabled', label: 'إظهار القسم', hint: 'عند إيقافه يختفي القسم تمامًا ويرتفع التذييل دون ترك فراغ.' },
      { type: 'text', key: 'title', label: 'العنوان' },
      { type: 'textarea', key: 'body', label: 'النص' },
      { type: 'group', key: 'button', label: 'الزر', fields: [
        { type: 'text', key: 'label', label: 'النص' },
        { type: 'select', key: 'destinationType', label: 'وجهة الزر', options: CTA_DEST, hint: 'واتساب/البريد: يُشتقّان من الإعدادات. صفحة داخلية/رابط خارجي: يستخدمان حقل «الوجهة».' },
        { type: 'text', key: 'destination', label: 'الوجهة (صفحة داخلية أو رابط خارجي)', hint: 'مثال: Contact.dc.html أو https://example.com' }
      ] },
      { type: 'select', key: 'background', label: 'نمط الخلفية', options: CTA_BG, hint: 'من ألوان الهوية فقط.' },
      { type: 'select', key: 'textStyle', label: 'نمط النص', options: CTA_TEXT, hint: 'تلقائي: يتباين مع الخلفية.' },
      { type: 'select', key: 'buttonStyle', label: 'نمط الزر', options: CTA_BTN }
    ] },

    { id: 'organizations', group: 'content', label: 'الجهات', desc: 'شريط شعارات الجهات التي تعاملت معها — مُدار بالكامل من هنا.', base: 'content.organizations', fields: [
      { type: 'checkbox', key: 'enabled', label: 'إظهار القسم', hint: 'عند إيقافه يختفي القسم تمامًا من الصفحة.' },
      { type: 'select', key: 'position', label: 'موضع القسم في الصفحة', options: ORG_POS, hint: 'يحدد مكان ظهور شريط الشعارات داخل الصفحة الرئيسية.' },
      { type: 'select', key: 'logoSize', label: 'حجم الشعارات', options: ORG_SIZE, hint: 'يتحكم في حجم عرض الشعارات على الموقع. يبقى متجاوبًا مع جميع أحجام الشاشات.' },
      { type: 'checkbox', key: 'showTitle', label: 'إظهار العنوان' },
      { type: 'text', key: 'title', label: 'العنوان' },
      { type: 'checkbox', key: 'showDescription', label: 'إظهار الوصف' },
      { type: 'textarea', key: 'body', label: 'الوصف' },
      { type: 'list', key: 'items', label: 'الجهات', itemLabel: 'جهة', addLabel: 'إضافة جهة', titleKey: 'name', fields: [
        { type: 'image', key: 'logo', label: 'الشعار',
          recommended: 'شعار أفقي بخلفية شفافة (PNG أو SVG)', formats: ['PNG', 'SVG', 'WebP', 'JPG'], maxSize: 2097152,
          hint: 'يظهر ضمن شريط الشعارات.' },
        { type: 'text', key: 'name', label: 'اسم الجهة', required: true },
        { type: 'text', key: 'url', label: 'رابط الموقع (اختياري)', hint: 'عند إضافته يُفتح في تبويب جديد. اتركه فارغًا لعرض شعار غير قابل للنقر.' },
        { type: 'text', key: 'alt', label: 'النص البديل', hint: 'وصف مختصر للشعار لتحسين الوصول. يُستخدم اسم الجهة إذا تُرك فارغًا.' },
        { type: 'number', key: 'order', label: 'ترتيب العرض', hint: 'الأصغر يظهر أولًا.' },
        { type: 'checkbox', key: 'hidden', label: 'إخفاء' }
      ] }
    ] },

    { id: 'latestArticles', group: 'content', label: 'أحدث المقالات', desc: 'قسم أحدث المقالات في الصفحة الرئيسية (يعرض آخر 3 مقالات منشورة).', base: 'content.latestArticles', fields: [
      { type: 'checkbox', key: 'enabled', label: 'إظهار القسم', hint: 'عند إيقافه يختفي القسم. يظهر تلقائيًا فقط عند وجود مقالات منشورة.' },
      { type: 'text', key: 'title', label: 'العنوان' },
      { type: 'text', key: 'viewAllLabel', label: 'نص زر «عرض كل المقالات»' }
    ] },

    { id: 'footer', group: 'content', label: 'التذييل', desc: 'أعمدة الروابط أسفل الموقع.', base: 'footer', fields: [
      { type: 'list', key: 'columns', label: 'الأعمدة', itemLabel: 'عمود', addLabel: 'إضافة عمود', titleKey: 'title', fields: [
        { type: 'text', key: 'title', label: 'عنوان العمود' },
        { type: 'list', key: 'links', label: 'الروابط', itemLabel: 'رابط', addLabel: 'إضافة رابط', titleKey: 'label', fields: [
          { type: 'text', key: 'label', label: 'النص' },
          { type: 'text', key: 'href', label: 'الرابط' },
          { type: 'checkbox', key: 'hidden', label: 'إخفاء من التذييل' }
        ] }
      ] }
    ] },

    { id: 'social', group: 'content', label: 'قنوات التواصل', desc: 'روابط الشبكات الاجتماعية.', base: '', dirtyPath: 'social', fields: [
      { type: 'list', key: 'social', label: 'القنوات', itemLabel: 'قناة', addLabel: 'إضافة قناة', titleKey: 'label', fields: [
        { type: 'select', key: 'type', label: 'المنصّة', options: SOCIAL_TYPES },
        { type: 'text', key: 'label', label: 'التسمية' },
        { type: 'text', key: 'href', label: 'الرابط', hint: 'يُتجاهل لقناة البريد — يُشتق من البريد الإلكتروني في «الهوية والعلامة».' },
        { type: 'checkbox', key: 'hidden', label: 'إخفاء' }
      ] }
    ] },

    { id: 'theme', group: 'content', label: 'التصميم (متقدّم)', desc: 'ألوان الهوية والخط. نادرًا ما تُعدّل.', base: 'theme', fields: [
      { type: 'group', key: 'color', label: 'الألوان', fields: [
        { type: 'color', key: 'bg', label: 'الخلفية' },
        { type: 'color', key: 'surface', label: 'السطح' },
        { type: 'color', key: 'ink', label: 'النص الأساسي' },
        { type: 'color', key: 'body', label: 'نص الفقرات' },
        { type: 'color', key: 'muted', label: 'نص باهت' },
        { type: 'color', key: 'line', label: 'الحدود' },
        { type: 'color', key: 'primary', label: 'اللون الأساسي' },
        { type: 'color', key: 'primaryHover', label: 'الأساسي عند التمرير' },
        { type: 'color', key: 'accent', label: 'اللون المميّز' },
        { type: 'color', key: 'accentHover', label: 'المميّز عند التمرير' },
        { type: 'color', key: 'dark', label: 'الداكن' },
        { type: 'color', key: 'onDark', label: 'نص على الداكن' }
      ] },
      { type: 'group', key: 'font', label: 'الخط', fields: [
        { type: 'text', key: 'family', label: 'عائلة الخط' },
        { type: 'text', key: 'googleHref', label: 'رابط خط Google' }
      ] },
      { type: 'select', key: 'numerals', label: 'الأرقام', options: [['western', 'غربية (123)'], ['arabic', 'عربية (١٢٣)']] }
    ] },

    /* ═══ SERVICES (new model, doc.services) ════════════════════════════ */
    { id: 'consultations', group: 'services', label: 'إدارة الاستشارات', desc: 'المصدر الوحيد لكل الاستشارات المعروضة في الموقع العام.', base: 'services', dirtyPath: 'services.consultations', fields: [
      { type: 'list', key: 'consultations', label: 'الاستشارات', itemLabel: 'استشارة', addLabel: 'إضافة استشارة', titleKey: 'title', fields: [
        { type: 'text', key: 'title', label: 'العنوان', required: true },
        { type: 'textarea', key: 'description', label: 'وصف مختصر' },
        { type: 'select', key: 'priceType', label: 'طريقة عرض السعر', options: PRICE_TYPE, hint: 'ثابت / يبدأ من: يستخدمان السعر والعملة. تواصل: يعرض «تواصل لمعرفة السعر». نص مخصص: يعرض «نص السعر المخصص».' },
        { type: 'number', key: 'price', label: 'السعر', hint: 'يُستخدم مع «سعر ثابت» و«يبدأ من».' },
        { type: 'select', key: 'currency', label: 'العملة', options: CURRENCY },
        { type: 'text', key: 'priceText', label: 'نص السعر المخصص', hint: 'يُستخدم مع «نص مخصص» فقط، مثل: حسب حجم المشروع.' },
        { type: 'select', key: 'period', label: 'دورة السعر', options: PERIOD, hint: 'لاحقة تظهر بعد السعر مع «سعر ثابت» و«يبدأ من» (مثل «/ شهريًا»). «مرة واحدة» بدون لاحقة.' },
        { type: 'number', key: 'durationMinutes', label: 'مدة الجلسة (دقائق)', hint: 'اتركه فارغًا أو صفرًا لإخفاء المدة.' },
        { type: 'list', key: 'features', label: 'المزايا', itemLabel: 'ميزة', addLabel: 'إضافة ميزة', strings: true },
        { type: 'text', key: 'badge', label: 'الشارة', hint: 'شارة نصية اختيارية، مثل: الأكثر طلبًا، موصى به، للمبتدئين. اتركها فارغة لإخفائها.' },
        { type: 'text', key: 'ctaLabel', label: 'نص زر الإجراء', hint: 'مثال: احجز الآن' },
        { type: 'text', key: 'ctaHref', label: 'وجهة الزر', hint: 'رابط أو صفحة، مثل: Contact.dc.html' },
        { type: 'number', key: 'order', label: 'ترتيب العرض', hint: 'الأصغر يظهر أولًا.' },
        { type: 'checkbox', key: 'active', label: 'مُفعّلة (تظهر في الموقع)' }
      ] }
    ] },

    { id: 'products', group: 'services', label: 'المنتجات الرقمية', desc: 'ملفات وقوالب ومنتجات رقمية.', base: 'services', dirtyPath: 'services.products', fields: [
      { type: 'list', key: 'products', label: 'المنتجات', itemLabel: 'منتج', addLabel: 'إضافة منتج', titleKey: 'title', fields: [
        { type: 'text', key: 'title', label: 'العنوان', required: true },
        { type: 'textarea', key: 'description', label: 'الوصف' },
        { type: 'image', key: 'cover', label: 'صورة الغلاف', recommended: '1200×750 بكسل', formats: ['JPG', 'PNG', 'WebP'], maxSize: 3145728 },
        { type: 'number', key: 'price', label: 'السعر' },
        { type: 'select', key: 'currency', label: 'العملة', options: CURRENCY },
        { type: 'select', key: 'format', label: 'النوع', options: [['pdf', 'PDF'], ['template', 'قالب'], ['video', 'فيديو'], ['bundle', 'حزمة']] },
        { type: 'file', key: 'url', label: 'ملف المنتج',
          formats: ['PDF', 'DOCX', 'XLSX', 'ZIP'], maxSize: 5242880,
          hint: 'الملف الذي يحصل عليه العميل بعد الشراء.' },
        { type: 'checkbox', key: 'active', label: 'مُفعّل' }
      ] }
    ] },

    /* ═══ BLOG / ARTICLES (doc.articles) ════════════════════════════════ */
    { id: 'articles', group: 'blog', label: 'المقالات', desc: 'إدارة مقالات المدونة — المصدر الوحيد للمقالات المنشورة على الموقع.', base: '', dirtyPath: 'articles', fields: [
      { type: 'list', key: 'articles', label: 'المقالات', itemLabel: 'مقال', addLabel: 'إضافة مقال', titleKey: 'title', fields: [
        { type: 'image', key: 'cover', label: 'صورة الغلاف', recommended: '1200×630 بكسل', formats: ['JPG', 'PNG', 'WebP'], maxSize: 3145728, hint: 'تظهر في بطاقات المقالات وأعلى صفحة المقال.' },
        { type: 'image', key: 'shareImage', label: 'صورة المشاركة (اختياري)', recommended: '1200×630 بكسل', formats: ['JPG', 'PNG', 'WebP'], maxSize: 3145728, hint: 'تُستخدم في المشاركة على الشبكات (Open Graph). تُستخدم صورة الغلاف تلقائيًا إذا تُركت فارغة.' },
        { type: 'text', key: 'title', label: 'العنوان', required: true },
        { type: 'text', key: 'slug', label: 'الرابط (Slug)', hint: 'مُعرّف المقال في الرابط. يُشتق من العنوان تلقائيًا عند الحفظ إذا تُرك فارغًا.' },
        { type: 'textarea', key: 'summary', label: 'ملخّص مختصر', hint: 'يظهر في البطاقات وقوائم المقالات.' },
        { type: 'richtext', key: 'body', label: 'محتوى المقال', hint: 'محرّر نصوص: عناوين، غامق، مائل، قوائم، روابط، وصور.' },
        { type: 'text', key: 'author', label: 'الكاتب (اختياري)' },
        { type: 'date', key: 'date', label: 'تاريخ النشر' },
        { type: 'date', key: 'updated', label: 'تاريخ آخر تحديث (اختياري)', hint: 'يظهر في صفحة المقال عند إضافته.' },
        { type: 'checkbox', key: 'published', label: 'منشور (يظهر في الموقع)' },
        { type: 'checkbox', key: 'featured', label: 'مقال مميّز (اختياري)' },
        { type: 'group', key: 'cta', label: 'دعوة إلى إجراء (نهاية المقال)', fields: [
          { type: 'checkbox', key: 'enabled', label: 'تفعيل الدعوة' },
          { type: 'text', key: 'title', label: 'العنوان' },
          { type: 'textarea', key: 'description', label: 'الوصف' },
          { type: 'text', key: 'buttonText', label: 'نص الزر' },
          { type: 'text', key: 'buttonUrl', label: 'رابط الزر', hint: 'صفحة داخلية أو رابط خارجي (يفتح في تبويب جديد). يصلح للحجز أو منتج أو دورة أو واتساب أو أي صفحة.' }
        ] },
        { type: 'text', key: 'seoTitle', label: 'عنوان SEO (اختياري)' },
        { type: 'textarea', key: 'seoDescription', label: 'وصف SEO (اختياري)' },
        { type: 'text', key: 'seoKeywords', label: 'كلمات مفتاحية SEO (اختياري)', hint: 'كلمات مفصولة بفواصل.' }
      ] }
    ] },

    { id: 'courses', group: 'services', label: 'الدورات التدريبية', desc: 'برامج ودورات تدريبية.', base: 'services', dirtyPath: 'services.courses', fields: [
      { type: 'list', key: 'courses', label: 'الدورات', itemLabel: 'دورة', addLabel: 'إضافة دورة', titleKey: 'title', fields: [
        { type: 'text', key: 'title', label: 'العنوان', required: true },
        { type: 'textarea', key: 'description', label: 'الوصف' },
        { type: 'image', key: 'cover', label: 'صورة الغلاف', recommended: '1200×750 بكسل', formats: ['JPG', 'PNG', 'WebP'], maxSize: 3145728 },
        { type: 'number', key: 'durationHours', label: 'المدة (ساعات)' },
        { type: 'select', key: 'level', label: 'المستوى', options: [['beginner', 'مبتدئ'], ['intermediate', 'متوسط'], ['advanced', 'متقدم']] },
        { type: 'number', key: 'price', label: 'السعر' },
        { type: 'select', key: 'currency', label: 'العملة', options: CURRENCY },
        { type: 'checkbox', key: 'active', label: 'مُفعّلة' }
      ] }
    ] }
  ];

  return { GROUPS: GROUPS, SECTIONS: SECTIONS, SERVICES_DEFAULT: SERVICES_DEFAULT };
})();

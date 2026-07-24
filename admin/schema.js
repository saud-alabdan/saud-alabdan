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
  var SOCIAL_TYPES = [['linkedin', 'LinkedIn'], ['x', 'X'], ['email', 'البريد']];
  var CTA = { type: 'group', key: 'cta', label: 'زر الإجراء', fields: [
    { type: 'text', key: 'label', label: 'النص' },
    { type: 'text', key: 'href', label: 'الرابط' }
  ] };

  var GROUPS = [
    { id: 'content', label: 'محتوى الموقع' },
    { id: 'services', label: 'الخدمات' }
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
      { type: 'email', key: 'email', label: 'البريد الإلكتروني', required: true },
      { type: 'text', key: 'location', label: 'الموقع' },
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
        { type: 'group', key: 'about', label: 'نبذة', fields: [{ type: 'text', key: 'title', label: 'العنوان' }] },
        { type: 'group', key: 'consulting', label: 'الاستشارات', fields: [{ type: 'text', key: 'title', label: 'العنوان' }] },
        { type: 'group', key: 'contact', label: 'تواصل', fields: [{ type: 'text', key: 'title', label: 'العنوان' }] }
      ] }
    ] },

    { id: 'navigation', group: 'content', label: 'القائمة الرئيسية', desc: 'روابط الشريط العلوي وزر الحجز.', base: 'navigation', fields: [
      { type: 'list', key: 'primary', label: 'روابط القائمة', itemLabel: 'رابط', addLabel: 'إضافة رابط', titleKey: 'label', fields: [
        { type: 'text', key: 'label', label: 'النص', required: true },
        { type: 'text', key: 'href', label: 'الرابط', required: true }
      ] },
      { type: 'group', key: 'cta', label: 'زر الحجز', fields: [
        { type: 'text', key: 'label', label: 'النص' },
        { type: 'text', key: 'href', label: 'الرابط' }
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
          { type: 'checkbox', key: 'consulting', label: 'الاستشارات' },
          { type: 'checkbox', key: 'about', label: 'نبذة' },
          { type: 'checkbox', key: 'contact', label: 'تواصل' }
        ] }
      ] }
    ] },

    { id: 'hero', group: 'content', label: 'الواجهة (Hero)', desc: 'العنوان الرئيسي أعلى الصفحة.', base: 'content.hero', fields: [
      { type: 'text', key: 'titleLines.0', label: 'العنوان — السطر الأول', required: true },
      { type: 'text', key: 'titleLines.1', label: 'العنوان — السطر الثاني' },
      { type: 'textarea', key: 'body', label: 'النص التعريفي' },
      CTA
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
      { type: 'text', key: 'title', label: 'العنوان' },
      { type: 'textarea', key: 'body', label: 'النص' },
      { type: 'group', key: 'button', label: 'الزر', fields: [{ type: 'text', key: 'label', label: 'النص' }] }
    ] },

    { id: 'footer', group: 'content', label: 'التذييل', desc: 'أعمدة الروابط أسفل الموقع.', base: 'footer', fields: [
      { type: 'list', key: 'columns', label: 'الأعمدة', itemLabel: 'عمود', addLabel: 'إضافة عمود', titleKey: 'title', fields: [
        { type: 'text', key: 'title', label: 'عنوان العمود' },
        { type: 'list', key: 'links', label: 'الروابط', itemLabel: 'رابط', addLabel: 'إضافة رابط', titleKey: 'label', fields: [
          { type: 'text', key: 'label', label: 'النص' },
          { type: 'text', key: 'href', label: 'الرابط' }
        ] }
      ] }
    ] },

    { id: 'social', group: 'content', label: 'قنوات التواصل', desc: 'روابط الشبكات الاجتماعية.', base: '', dirtyPath: 'social', fields: [
      { type: 'list', key: 'social', label: 'القنوات', itemLabel: 'قناة', addLabel: 'إضافة قناة', titleKey: 'label', fields: [
        { type: 'select', key: 'type', label: 'النوع', options: SOCIAL_TYPES },
        { type: 'text', key: 'label', label: 'التسمية' },
        { type: 'text', key: 'href', label: 'الرابط' }
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

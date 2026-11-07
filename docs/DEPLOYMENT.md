# إعداد النشر السحابي

هذا المستودع تطبيق React/Vite مع خادم Node.js/Express وقاعدة MongoDB. لا تستخدم ملفات FastAPI أو PostgreSQL أو Next.js الواردة في أمثلة سابقة لهذا المستودع.

## Vercel للواجهة

1. أنشئ مشروع Vercel من المستودع، وحدد **Root Directory** إلى `client`.
2. تُستخدم إعدادات `client/vercel.json` لبناء Vite ونشر `dist` مع دعم مسارات React Router.
3. أضف متغير البيئة `VITE_API_URL` في إعدادات Vercel، واجعله عنوان API العام مثل `https://<backend-host>`. لا تضف `/api` إلى نهاية القيمة.
4. أضف عنوان الواجهة المنشور إلى `CORS_ORIGINS` و`FRONTEND_URL` في بيئة الخادم.
5. لا تحفظ أسرار PayPal أو SMTP أو MongoDB في إعدادات Vercel أو متغير `VITE_*`. كل متغير `VITE_*` متاح للمتصفح.

## Render للخادم

يوفر `render.yaml` خدمة Docker للخادم، ويستخدم `Dockerfile` لتثبيت متطلبات Puppeteer لبناء PDF. أنشئ الخدمة من Blueprint في Render، ثم أدخل القيم المطلوبة من لوحة Render:

- `MONGODB_URI`
- `AUTH_TOKEN_SECRET` (قيمة عشوائية قوية بطول 32 بايت على الأقل)
- `ADMIN_EMAIL` و`ADMIN_PASSWORD`
- `PAYPAL_ENV` (`sandbox` أولاً، ثم `live` عند الموافقة على الإنتاج)
- `PAYPAL_CLIENT_ID` و`PAYPAL_CLIENT_SECRET` و`PAYPAL_WEBHOOK_ID` من بيئة PayPal نفسها
- `FRONTEND_URL` و`CORS_ORIGINS` (النطاقات الفعلية مفصولة بفواصل)
- بيانات SMTP عند تجهيز البريد

يستخدم فحص الصحة `/api/health` ويتحقق من اتصال MongoDB. لا تعتبر نشر الخدمة جاهزاً حتى ينجح الفحص ويعمل التدفق من الواجهة المنشورة.

## سكريبت النشر

يستهدف `deploy.sh` بيئة Bash مع Render وVercel. يشغّل اختبارات الخادم والواجهة، وفحص lint والبناء، ثم يرسل Render deploy hook وينتظر فحص الصحة قبل تشغيل `vercel --prod`. لن يبدأ دون اختيار الإنتاج وتأكيد صريح. يتطلب `RENDER_DEPLOY_HOOK` و`BACKEND_HEALTH_URL` وVercel CLI مربوطاً بالمشروع. لا يشغّل ترحيلاً أو أوامر كتابة مباشرة على قاعدة البيانات. راجع النطاقات ومتغيرات Vercel وRender قبل تشغيله.

## إعدادات الدفع والبريد

- يبدأ الإعداد بـ`PAYPAL_ENV=sandbox`. لا تغيّره إلى `live` قبل إتمام اختبارات Sandbox والتحقق من حساب التاجر والسعر وسياسة الاسترداد.
- عند اعتماد الإنتاج، اضبط `PAYPAL_ENV=live` في Render وأدخل `PAYPAL_CLIENT_ID` و`PAYPAL_CLIENT_SECRET` المطابقين لتطبيق Live في لوحة الأسرار لدى Render. لا تخلط بيانات Sandbox وLive. لا تضع `PAYPAL_CLIENT_SECRET` في الواجهة أو ملفات Git؛ يعيد endpoint الإعداد `PAYPAL_CLIENT_ID` فقط للمتصفح.
- لا يحتاج التكامل الحالي إلى `PAYPAL_API_BASE`؛ حزمة PayPal SDK تختار نقطة النهاية من `PAYPAL_ENV` (`sandbox` أو `live`).
- endpoint Webhook متاح على `/api/webhooks/paypal`. أضف `PAYPAL_WEBHOOK_ID` المطابق للبيئة في Render، واضبط أحداث PayPal وفق [دليل الإعداد](./PAYPAL_SETUP.md). يُتحقق من كل توقيع عبر PayPal؛ لا تستخدم Webhook ID الخاص بـSandbox في Live.
- لا تنشئ أو ترفع `backend/.env.production` لهذا المستودع. إعداد الخادم هو Node في الجذر؛ استخدم إعدادات البيئة السرية لدى Render. ملف `.env.production` مستثنى من Git.
- يرفض الخادم قيمة `PAYPAL_ENV` غير `sandbox` أو `live`، ويتطلب في وضع Live وجود المفتاحين معاً. تحقق من متغيرات Render قبل إعادة تشغيل الخدمة.
- أحداث الالتقاط المكتملة تُطابق مع سجل التقييم وطلب PayPal والمبلغ والعملة قبل تحديث الدفع. أحداث الرفض والاسترداد تسجل للمراجعة ولا تُحدّث حالة الدفع أو تنفذ استرداداً تلقائياً.
- يمكن إضافة مفاتيح SMTP في Render فقط. اختبر وصول رسالة إلى عنوان اختباري واحترام تفضيلات الإشعارات قبل الإطلاق.

## قاعدة البيانات والتراجع

لا تشغّل سكريبت إعداد أو ترحيل على قاعدة الإنتاج دون مراجعة مستقلة ونسخة احتياطية مجرّبة. التطبيق يستخدم MongoDB ومخططات Mongoose وفهارس تُهيأ عند بدء التشغيل؛ أمثلة `asyncpg`, `COPY`, وملفات PostgreSQL لا تنطبق عليه.

ابدأ ببيئة منفصلة وقاعدة بيانات اختبار. تحقق من `/api/health`، التسجيل، التقييم، توليد وتنزيل PDF، الدفع في Sandbox، البريد، حذف حساب الاختبار، والسجلات. خطط للرجوع إلى إصدار التطبيق السابق قبل أي إطلاق عام.

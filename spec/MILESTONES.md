# MILESTONES: בדיחה בלחיצה
כלל: בסוף כל Milestone ה-AI עוצר, וממתין לבדיקה ולאישור מפורש שלי לפני שהוא ממשיך.

חמישה Milestones. שלושת הראשונים, כשעתיים בסך הכל, בונים את המוצר לפי ה-PRD. Milestones 4 ו-5 מרחיבים אותו: בדיחה ממאגר בגיליון Google, ושמירה של בדיחות ה-AI ב-Supabase עם "צחקתי". בכל מה שנוגע ל-Milestones 4 ו-5, הקובץ הזה ו-ARCHITECTURE.md קובעים, גם מול "בלי שמירה" ב-PRD, ב-MVP וב-product-10-definitions.

את המפתחות של OpenAI ואת המפתח הסודי של Supabase אף פעם לא נותנים ל-Claude: מפתח ה-production עובר ישר מהספק ל-Vercel, ומפתח ה-dev מודבק ביד ב-.env.local.

בכל Milestone שמשנה קבצים של האתר מעלים את גרסת המטמון ב-sw.js (`joke-v1`, ‏`joke-v2` וכן הלאה), כדי שהאפליקציה המותקנת תקבל את הגרסה החדשה.

איפה מריצים: הבחירה שלי. אפשר לבדוק כל Milestone בכתובת של Vercel אחרי push, ואפשר גם להריץ במחשב עם vercel dev. הקוד זהה בשני המקרים.

## Milestone 1: Walking Skeleton
- המטרה: הדף והפונקציה באוויר ב-Vercel, באותה כתובת, ומדברים זה עם זה. המפתח כבר שמור ב-Vercel, אבל עוד בלי AI.
- מה מממשים:
  - index.html עם המסך הראשי לפי DESIGN.md: לוגו, הסבר, תווית, תיבה, כפתור, בועה עם הדמות, ושורת תחתית. הלוגו, ארבעת הציורים של הדמות והרקע מגיעים מתיקיית assets.
  - api/joke.js עם `export default` שבתוכו `fetch(request)`. מקבלת POST עם `{ "topic": "..." }` ומחזירה `{ "joke": "בדיחה זמנית מהשרת: [הנושא]. המפתח: נמצא" }`, או "המפתח: חסר" כש-`process.env.OPENAI_API_KEY` ריק. רק כן או לא, אף פעם לא המפתח עצמו.
  - הכפתור שולח POST ל-/api/joke ומציג את `joke` בבועה, עם textContent.
  - package.json עם `"type": "module"`, בלי dependencies.
  - בדיקה ש-.gitignore, ‏.env.example ו-.claude/settings.json קיימים מההקמה. חסר אחד מהם? יוצרים אותו לפני כל commit.
  - push ל-main, ואז ב-Vercel: New Project, ‏Import לריפו, ‏Framework Preset: Other, ‏Deploy.
- ביד, אחרי הפריסה הראשונה:
  - ב-OpenAI, ב-API keys: יוצרים מפתח production בשם `joke-in-a-click`.
  - ב-Vercel, ב-Environment Variables: השם `OPENAI_API_KEY`, הסוג Secret, בסביבות Production ו-Preview. ואז Redeploy.
- הרצה מקומית, רשות:
  - ב-OpenAI: מפתח נוסף, מפתח dev, בשם `joke-in-a-click-dev`.
  - מעתיקים את .env.example ל-.env.local, ומדביקים את מפתח ה-dev אחרי הסימן =. ביד, לא דרך Claude. הקובץ מכיל רק את השורה OPENAI_API_KEY=, בלי הערות ובלי משתנים נוספים.
  - מתקינים את ה-CLI של Vercel: `npm i -g vercel`, ואז `vercel login` ו-`vercel link`.
  - `vercel dev` מריץ את האתר ואת הפונקציה בכתובת http://localhost:3000.
- התוצר המצופה: כתובת בסגנון my-joke-app.vercel.app. כותבים נושא, לוחצים, ומקבלים "בדיחה זמנית מהשרת: [הנושא]. המפתח: נמצא".
- תנאי השלמה (Definition of Done):
  1. הכתובת נפתחת בטלפון, בעברית, מימין לשמאל, ובעיצוב של DESIGN.md.
  2. לחיצה מציגה "בדיחה זמנית מהשרת" עם הנושא, ו"המפתח: נמצא".
  3. בלשונית Network: בקשת POST אחת ל-/api/joke, באותה כתובת של האתר.
  4. ב-Logs של Vercel יש שורה לכל לחיצה.
  5. אין בקוד כותרות CORS, ואין טיפול ב-OPTIONS.
  6. בריפו ב-GitHub אין .env ואין .env.local. יש .env.example עם השורה OPENAI_API_KEY= בלבד, ויש .claude/settings.json.
  7. מי שמריץ מקומית: אותה תוצאה בכתובת http://localhost:3000.

## Milestone 2: בדיחה מ-GPT-5
- המטרה: הבדיחה מגיעה מ-GPT-5 דרך הפונקציה, והמפתח נשאר בשרת.
- לפני הקוד, ביד: לוודא שב-OpenAI יש קרדיט מראש, Auto recharge כבוי, ומגבלת הוצאה חודשית. המפתח כבר ב-Vercel מ-Milestone 1.
- מה מממשים:
  - Claude קורא קודם בתיעוד העדכני של OpenAI ושל Vercel את מבנה הבקשה והתשובה, ורק אחר כך כותב קוד.
  - api/joke.js פונה ל-Responses API עם fetch, לפי סעיף 4 ב-ARCHITECTURE.md: המפתח מ-`process.env.OPENAI_API_KEY`, המודל מ-`process.env.OPENAI_MODEL` או `gpt-5`, והפרומפט המרכזי.
  - הנושא נחתך ל-100 תווים. נושא ריק או גוף שבור: בדיחה כללית.
  - הטקסט נשלף מהתשובה, ורק הבדיחה חוזרת לדף.
  - כל שגיאה: הודעה קצרה בעברית לדף, והפרטים ב-console.error.
  - בדף: ארבעת המצבים, עם ארבעת הציורים של הדמות, "עוד בדיחה!" ו"לנסות שוב", לפי DESIGN.md.
  - push. אין צורך ב-Redeploy: המשתנה היה ב-Vercel עוד לפני הפריסה הזו.
- התוצר המצופה: בדיחה אמיתית על הנושא, בטלפון.
- תנאי השלמה (Definition of Done):
  1. "חתולים" מחזיר בדיחה על חתולים.
  2. תיבה ריקה מחזירה בדיחה כללית.
  3. התיבה לא מקבלת יותר מ-100 תווים.
  4. `OPENAI_MODEL` עם שם שגוי, ואחריו Redeploy: הדף מציג הודעה בעברית, וב-Logs יש שורה אדומה. אחר כך מוחקים את המשתנה, ועושים Redeploy שוב.
  5. בלשונית Network יש בקשה ל-/api/joke, ואין בקשה ל-api.openai.com.
  6. חיפוש בקוד הדף (Ctrl+U ואז Ctrl+F) על `sk-` לא מוצא כלום.
  7. Claude מסביר בחמש שורות פשוטות איפה המפתחות נמצאים, ולמה הם לא מגיעים לדפדפן. בלי לבקש אף מפתח.
  8. מי שמריץ מקומית: בדיחה אמיתית גם ב-localhost, עם מפתח ה-dev.

## Milestone 3: התקנה בטלפון
- המטרה: מתקינים את האפליקציה במסך הבית, והיא נפתחת במסך מלא.
- מה מממשים:
  - manifest.webmanifest עם `name: "בדיחה בלחיצה"`, ‏`short_name`, ‏`start_url`, ‏`display: standalone`, ‏`lang: he`, ‏`dir: rtl`, ‏`theme_color` ו-`background_color`, שניהם `#FFE15A`.
  - אייקונים מתיקיית assets: assets/icon-192.png, ‏assets/icon-512.png, ו-assets/icon-512-maskable.png עם `purpose: maskable`.
  - sw.js בגישת network-first, לפי סעיף 7 ב-ARCHITECTURE.md. בקשה ל-/api לא נשמרת במטמון אף פעם.
  - ב-index.html: קישור ל-manifest, ‏`theme-color`, אייקון, ורישום של sw.js.
  - push. אין צורך ב-Redeploy.
- התוצר המצופה: הכפתור האדום הצוחק במסך הבית של הטלפון.
- תנאי השלמה (Definition of Done):
  1. במחשב, בכלי המפתחים, Application ואז Manifest: אין שגיאות, ושני האייקונים מופיעים.
  2. בטלפון: "התקנת אפליקציה" או "הוספה למסך הבית" מופיע, והאפליקציה נפתחת בלי שורת כתובת.
  3. בתוך האפליקציה המותקנת מגיעה בדיחה חדשה בכל לחיצה.
  4. ב-Application ואז Cache Storage אין אף כתובת של /api.
  5. שינוי קטן בטקסט, push, ורענון: השינוי מופיע.

## Milestone 4: בדיחה מהמאגר
- המטרה: כפתור שני מביא בדיחה אקראית מגיליון Google שאני עורך בעצמי. הגיליון לקריאה בלבד, והדף פונה רק ל-/api.
- לפני הקוד:
  - Claude מבקש ממני את קישור העריכה של הגיליון, וקורא דרך המחבר של Google Sheets את שורה 1 ואת שלוש השורות הראשונות בלשונית `jokes`, כדי שהקוד יתאים לגיליון האמיתי. את הקישור הוא לא שומר באף קובץ, גם לא בתוכנית.
  - ביד: בגיליון, File, ואז Share, ואז Publish to web, הלשונית `jokes`, בפורמט CSV. את הקישור שמתקבל שומרים ב-Vercel, ב-Environment Variables, בשם `SHEET_CSV_URL`, מסוג Config, בסביבות Production ו-Preview. ואז Redeploy.
- מה מממשים:
  - בדף: כפתור שני מתחת לכפתור הקיים, "בדיחה אקראית מהמאגר". הוא שולח GET ל-/api/random, ומציג את הבדיחה באותה בועה ובאותם ארבעה מצבים, עם textContent.
  - api/random.js עם `export default { async fetch(request) { ... } }`. הכתובת רק מ-`process.env.SHEET_CSV_URL`, ולא כתובה בשום קובץ.
  - הגיליון בנוי מהכותרות `topic` ו-`text`. הכותרות נקראות בלי תלות באותיות גדולות או קטנות, ובלי רווחים בקצוות. שורה בלי `text` מדלגים עליה.
  - פענוח CSV אמיתי, בלי ספרייה: בדיחה יכולה להכיל פסיקים, מירכאות (`""` בתוך שדה במירכאות) ושורות חדשות.
  - הפונקציה שומרת את השורות בזיכרון לדקה, ובוחרת שורה אקראית מתוכן. כישלון לא נשמר בזיכרון.
  - מחזירה `{ "joke": "...", "topic": "..." }`, עם `Cache-Control: no-store`.
  - שגיאות: הודעה קצרה בעברית לדף, והפרטים ב-console.error.
    - חסרה כתובת: "המאגר עוד לא מחובר".
    - הגיליון לא מפורסם כ-CSV (חוזר HTML, או שאין כותרת `text`): "הגיליון לא מפורסם כ-CSV".
    - אין אף בדיחה: "המאגר ריק".
  - sw.js: הגרסה עולה ל-`joke-v2`.
  - push. אין צורך ב-Redeploy, אם `SHEET_CSV_URL` נשמר לפני הפריסה.
- התוצר המצופה: לחיצה על "בדיחה אקראית מהמאגר" מציגה בדיחה מהגיליון שלי.
- תנאי השלמה (Definition of Done):
  1. הכפתור "בדיחה אקראית מהמאגר" מופיע מתחת לכפתור הקיים, ובכמה לחיצות מגיעות בדיחות שונות מהגיליון.
  2. בדיחה עם פסיק, עם מירכאות ועם ירידת שורה מוצגת שלמה ונכונה.
  3. כותרות בגיליון כמו `Topic` ו-`TEXT` עובדות בדיוק כמו `topic` ו-`text`.
  4. בלשונית Network יש בקשה ל-/api/random בלבד, ואין בקשה ל-docs.google.com.
  5. חיפוש בקוד הדף ובריפו לא מוצא את קישור הגיליון.
  6. בתוך דקה מהבקשה הקודמת: ב-Logs לא מופיעה הורדה חדשה של הגיליון. אחרי דקה: מופיעה.
  7. מוחקים את `SHEET_CSV_URL` ועושים Redeploy: הדף מציג "המאגר עוד לא מחובר", וב-Logs יש שורה אדומה. מחזירים את המשתנה ועושים Redeploy.
  8. ב-Application ואז Service Workers מופיע `joke-v2`, וב-Cache Storage אין אף כתובת של /api.
  9. כפתור הבדיחה מ-AI ממשיך לעבוד כמו קודם.

## Milestone 5: האפליקציה זוכרת
- המטרה: כל בדיחת AI נשמרת ב-Supabase. מתחת לבדיחה יש כפתור "צחקתי" עם מונה, ובדף יש רשימת "הכי מצחיקות". רק הפונקציות מדברות עם Supabase.
- לפני הקוד, דרך המחבר של Supabase:
  - Claude בודק את רשימת הפרויקטים. אם יש יותר מפרויקט אחד, הוא שואל אותי באיזה.
  - Claude כותב את ה-SQL, שומר אותו גם בקובץ `db/create_jokes.sql`, ומציג לי אותו לפני ההרצה.
  - אחרי האישור שלי: migration בשם `create_jokes`.
  - אחרי ההרצה: `get_advisors`, הסבר בעברית של מה שנמצא, ועצירה. אני בודק שהטבלה נעולה.
- ה-SQL:
  - טבלה `public.jokes`:
    - `id` מסוג uuid, מפתח ראשי, ברירת מחדל `gen_random_uuid()`.
    - `created_at` מסוג timestamptz, ברירת מחדל `now()`.
    - `topic` מסוג text.
    - `text` מסוג text, חובה.
    - `laughs` מסוג integer, חובה, ברירת מחדל 0.
  - RLS דולק, בלי אף policy.
  - `grant select, insert, update` על הטבלה ל-service_role בלבד. `revoke all` מ-anon ומ-authenticated.
  - פונקציה `public.add_laugh(joke_id uuid)` שמחזירה את המספר החדש. עדכון אחד: `laughs = laughs + 1` בשורה עם ה-id, ומחזירה את הערך אחרי העדכון, או null אם אין שורה כזו. security invoker, ‏search_path ריק, ושמות מלאים (`public.jokes`). ‏`revoke execute` מ-public, מ-anon ומ-authenticated, ו-`grant execute` ל-service_role.
- מה מממשים:
  - package.json: ‏`@supabase/supabase-js` ב-dependencies.
  - lib/supabase.js: לקוח אחד, עם הכתובת מ-`process.env.SUPABASE_URL` והמפתח מ-`process.env.SUPABASE_SECRET_KEY`. זה הקובץ היחיד שקורא את המפתח הזה.
  - api/joke.js: שומר כל בדיחת AI בטבלה, עם הנושא, ומחזיר `{ "joke": "...", "id": "..." }`. אם השמירה נכשלת, הבדיחה עדיין מגיעה עם `id: null`, והשגיאה ב-console.error.
  - api/laugh.js: מקבל POST עם `{ "id": "..." }`, בודק שזה uuid, וקורא ל-`add_laugh` דרך rpc. מחזיר `{ "laughs": 3 }`. ‏id לא תקין: 400. אין בדיחה כזו: 404.
  - api/top.js: מקבל GET, ומחזיר `{ "jokes": [...] }` עם חמש הבדיחות עם הכי הרבה צחוקים, רק כאלה עם צחוק אחד לפחות. כל פריט: `id`, ‏`topic`, ‏`text`, ‏`laughs`.
  - בדף:
    - מתחת לבדיחת AI: כפתור "צחקתי" עם המונה. אחרי לחיצה הוא ננעל, ומציג את המספר החדש. בדיחה בלי id, למשל כשהשמירה נכשלה: בלי כפתור.
    - רשימת "הכי מצחיקות": נטענת בפתיחת הדף, ומתעדכנת אחרי כל "צחקתי". בלי polling. ריקה: הודעה קצרה.
    - בדיחות מהגיליון לא נשמרות, ואין מתחתן כפתור "צחקתי".
    - כל טקסט מהנתונים מוצג עם textContent.
  - sw.js: הגרסה עולה ל-`joke-v3`.
- לפני הדחיפה, עצירה: אני שם ב-Vercel את `SUPABASE_URL` מסוג Config ואת `SUPABASE_SECRET_KEY` מסוג Secret, בסביבות Production ו-Preview. Claude לא מבקש ממני את המפתח.
- push, ואז Redeploy אם המשתנים נשמרו אחרי הפריסה.
- הרצה מקומית, רשות: מוסיפים ביד ל-.env.local את `SUPABASE_URL`, את `SHEET_CSV_URL` ואת `SUPABASE_SECRET_KEY`. ביד, לא דרך Claude.
- התוצר המצופה: בדיחה מ-AI, לחיצה על "צחקתי", והבדיחה מופיעה ב"הכי מצחיקות".
- תנאי השלמה (Definition of Done):
  1. אחרי ה-migration: ‏`get_advisors` הוסבר בעברית, ואני אישרתי שהטבלה נעולה.
  2. `db/create_jokes.sql` זהה ל-migration שרץ.
  3. בטבלה `public.jokes` נוספת שורה לכל בדיחת AI. בדיחה מהגיליון לא מוסיפה שורה.
  4. "צחקתי" מעלה את המונה באחד, וננעל. הבדיחה מופיעה ב"הכי מצחיקות" בלי רענון.
  5. ב"הכי מצחיקות" יש עד חמש בדיחות, מסודרות מהכי הרבה צחוקים, ואין בדיחה עם 0.
  6. בלשונית Network יש בקשות רק ל-/api, ואין בקשה ל-supabase.co. חיפוש בקוד הדף לא מוצא `supabase` ולא `sb_`.
  7. בקשה ישירה ל-Supabase עם המפתח הציבורי (anon או publishable) לא מחזירה אף שורה, ולא מצליחה לקרוא ל-`add_laugh`.
  8. POST ל-/api/laugh עם id שאינו uuid מחזיר 400, ועם uuid שלא קיים מחזיר 404.
  9. כש-Supabase לא זמין (למשל `SUPABASE_URL` שגוי ו-Redeploy): בדיחת AI עדיין מגיעה, בלי כפתור "צחקתי", וב-Logs יש שורה אדומה. מתקנים ועושים Redeploy.
  10. ב-Application ואז Service Workers מופיע `joke-v3`, וב-Cache Storage אין אף כתובת של /api.

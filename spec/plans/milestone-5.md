# Milestone 5: האפליקציה זוכרת, תוכנית ומה נבנה

## המטרה
כל בדיחת AI נשמרת ב-Supabase. מתחת לבדיחה יש כפתור "צחקתי" עם מונה, ובדף יש רשימת "הכי מצחיקות". רק הפונקציות מדברות עם Supabase.

## לפני הקוד, דרך המחבר של Supabase
- רשימת הפרויקטים: פרויקט אחד, `53500.5 course Project 1` (אזור Sydney). עליו רץ ה-migration.
- ה-SQL כתוב ב-`db/create_jokes.sql`, ומוצג לאישור לפני ההרצה.
- אחרי האישור: migration בשם `create_jokes`, עם אותו SQL בדיוק.
- אחרי ההרצה: `get_advisors` (security ו-performance), הסבר בעברית, ועצירה עד שאני מאשר שהטבלה נעולה.

## ה-SQL (`db/create_jokes.sql`)
- `public.jokes`: ‏`id` uuid מפתח ראשי עם `gen_random_uuid()`, ‏`created_at` timestamptz עם `now()`, ‏`topic` text, ‏`text` text חובה, ‏`laughs` integer חובה, 0.
- RLS דולק, בלי policy. ‏`revoke all` מ-anon ומ-authenticated, ‏`grant select, insert, update` ל-service_role.
- `public.add_laugh(joke_id uuid)`: פונקציית SQL עם `update ... set laughs = laughs + 1 ... returning laughs`. אין שורה: null. ‏security invoker, ‏`search_path = ''`, שמות מלאים. ‏`revoke execute` מ-public, anon ו-authenticated, ‏`grant execute` ל-service_role.

## מה בונים
| קובץ | השינוי |
|---|---|
| `package.json` | ‏`@supabase/supabase-js` ב-dependencies |
| `lib/supabase.js` | לקוח אחד, מ-`SUPABASE_URL` ו-`SUPABASE_SECRET_KEY`. הקובץ היחיד שקורא את המפתח |
| `api/joke.js` | אחרי בדיחה: insert עם `topic` (ריק: null) ו-`text`. מחזיר `{ joke, id }`. שמירה נכשלה: `id: null`, והשגיאה ב-console.error |
| `api/laugh.js` | ‏POST `{ id }`. לא uuid: 400. ‏rpc `add_laugh`. ‏null: 404. מחזיר `{ laughs }` |
| `api/top.js` | ‏GET. ‏`laughs >= 1`, מסודר מהכי הרבה, עד 5. מחזיר `{ jokes: [{ id, topic, text, laughs }] }`, עם `Cache-Control: no-store` |
| `index.html` | כפתור "צחקתי" מתחת לבדיחת AI, ורשימת "הכי מצחיקות" |
| `sw.js` | ‏`joke-v3` |

## lib/supabase.js
- `createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })`, כי זה שרת בלי משתמשים.
- חסר משתנה: הלקוח הוא null, וכל פונקציה מתייחסת לזה כמו לכישלון של Supabase (שורה ב-console.error).

## api/laugh.js ו-api/top.js
- שגיאות, תמיד `{ "error": "..." }` בעברית, והפרטים ב-console.error:
  | המצב | ההודעה | הסטטוס |
  |---|---|---|
  | לא POST או לא GET | אפשר לשלוח רק POST / GET. | 405 |
  | id שאינו uuid | הבדיחה לא נמצאה. | 400 |
  | אין בדיחה עם ה-id | הבדיחה לא נמצאה. | 404 |
  | Supabase לא זמין או לא מוגדר | הצחוקים לא זמינים כרגע. נסו שוב עוד רגע. | 500 |

## index.html
- "צחקתי" מופיע רק מתחת לבדיחת AI שחזרה עם `id`. בדיחה מהמאגר, שגיאה, או `id: null`: בלי כפתור.
- הכפתור: "😂 צחקתי · 0". בלחיצה ננעל מיד, ואחרי התשובה מציג את המספר החדש. שגיאה: נשאר נעול, עם "לא נשמר".
- רשימת "הכי מצחיקות" מתחת לבועה: כרטיס לבן, עד חמש שורות, כל אחת עם הבדיחה ומספר הצחוקים. נטענת בפתיחת הדף ואחרי כל "צחקתי" שהצליח. בלי polling. ריקה: "עוד אין פה בדיחות. צחקו על משהו!". שגיאה: "הרשימה לא זמינה כרגע".
- כל טקסט מהנתונים עם textContent, ונבנה עם createElement.
- בדף אין `supabase` ואין `sb_`.

## עצירה לפני הדחיפה
- ביד ב-Vercel: ‏`SUPABASE_URL` מסוג Config ו-`SUPABASE_SECRET_KEY` מסוג Secret, ב-Production וב-Preview. Claude לא מבקש את המפתח.
- push, ואז Redeploy אם המשתנים נשמרו אחרי הפריסה.

## מה נבנה בפועל
- **migrations:** ‏`create_jokes`, זהה ל-`db/create_jokes.sql`. אחריו נמצא של-service_role יש גם delete, truncate, references ו-trigger, מברירת המחדל של Supabase. לכן רץ, באישור, migration שני: `restrict_jokes_service_role` (`db/restrict_jokes_service_role.sql`). עכשיו ל-service_role יש רק select, insert, update, ול-anon ול-authenticated אין כלום. ‏`get_advisors`: רק `rls_enabled_no_policy` ברמת INFO, וזה בכוונה.
- **package.json:** ‏`@supabase/supabase-js` ‏`^2.118.0`, ו-package-lock.json.
- **lib/supabase.js:** לפי התוכנית. חסר משתנה: שורה ב-console.error והלקוח null.
- **api/joke.js:** ‏`saveJoke` אחרי הבדיחה. נושא ריק נשמר כ-null. כישלון: `id: null` ושורה `save joke failed` ב-console.error.
- **api/laugh.js:** ‏uuid נבדק בביטוי רגולרי. ‏400 ו-404 עם "הבדיחה לא נמצאה.". ‏console.log `laugh: id, laughs` לכל צחוק.
- **api/top.js:** סדר משני לפי `created_at`, כדי שבתיקו החדשה תופיע קודם. ‏Supabase לא זמין: הלקוח מנסה שוב קריאות GET כמה פעמים, ולכן השגיאה מגיעה אחרי כ-7 שניות. זה לא משפיע על הבדיחה.
- **index.html:** ‏"😂 צחקתי · 0" בגלולה צהובה בתוך הבועה. ‏`jokeId` שומר איזו בדיחה מוצגת, וכל `setState` מסתיר את הכפתור, ולכן בדיחה מהמאגר, שגיאה או `id: null` בלי כפתור. אם התשובה של "צחקתי" מגיעה אחרי שכבר מוצגת בדיחה אחרת, לא נוגעים בכפתור. "הכי מצחיקות": כרטיס לבן מתחת לבועה, הבדיחה בכתב היד ומונה בגלולה צהובה.
- **sw.js:** ‏`joke-v3`.

## נבדק לפני ה-push
מול OpenAI ו-Supabase מדומים במחשב, ובדפדפן Chromium:
- בדיחת AI מחזירה `id` ומוסיפה שורה. נושא ריק נשמר כ-null.
- "צחקתי" מעלה ל-1 וננעל. הבדיחה מופיעה ב"הכי מצחיקות" בלי רענון, מסודרת מהכי הרבה צחוקים, ובלי בדיחות עם 0.
- ‏`/api/laugh`: לא uuid: ‏400. ‏uuid שלא קיים: ‏404. ‏GET: ‏405. ‏POST ל-`/api/top`: ‏405. ‏`/api/top` עם `Cache-Control: no-store`.
- בדיחה מהמאגר: בלי כפתור "צחקתי".
- ‏Supabase לא זמין: הבדיחה מגיעה עם `id: null`, בלי כפתור, ושורה ב-console.error. ‏"צחקתי" ו"הכי מצחיקות" מחזירים 500 בעברית.
- ‏Network: רק /api. בקוד הדף אין `supabase` ואין `sb_`.

## פריסה בפועל
- מוזג ל-main ב-PR #5, ונפרס לבד ב-Vercel: https://joke-app-ebon-nu.vercel.app
- ב-Vercel: ‏`SUPABASE_URL` ב-Production וב-Preview, ‏`SUPABASE_SECRET_KEY` ב-Production בלבד. ב-Preview אין שמירה ואין "צחקתי".
- נבדק בכתובת החיה: ‏`sw.js` בגרסה `joke-v3`. ‏`/api/top` מחזיר 200 עם רשימה ריקה. ‏`/api/laugh` עם id שאינו uuid מחזיר 400, ועם uuid שלא קיים מחזיר 404, כלומר הפונקציה מדברת עם Supabase. בקוד הדף אין `supabase` ואין `sb_`.
- נבדק מול Supabase עם המפתח הציבורי (publishable): קריאה, הוספה וקריאה ל-`add_laugh` מחזירות `42501 permission denied`.
- אושר.

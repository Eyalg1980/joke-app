# Milestone 5: האפליקציה זוכרת, תוכנית ומה נבנה

## המטרה
כל בדיחת AI נשמרת ב-Supabase. מתחת לבדיחה יש כפתור "צחקתי" עם מונה, ובדף יש רשימת "הכי מצחיקות". רק הפונקציות מדברות עם Supabase.

## לפני הקוד, דרך המחבר של Supabase
- רשימת הפרויקטים: בארגון `Eyalg1980` אין עדיין אף פרויקט. צריך פרויקט אחד לפני ה-migration.
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
(יתעדכן בשלב הבנייה)

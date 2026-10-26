# ARCHITECTURE: בדיחה בלחיצה

## 1. מבנה המערכת בשלוש שכבות

### צד לקוח
- index.html אחד, עם ה-CSS וה-JavaScript בתוכו. עברית, `lang="he"` ו-`dir="rtl"`.
- הלוגו, ארבעת הציורים של הדמות והרקע הם קבצי SVG בתיקיית assets. הדף מחליף ביניהם לפי `data-state` על הבועה: idle, think, joke, error.
- טופס עם תיבה (maxlength 100) וכפתור. בשליחה: POST ל-/api/joke, ואז הצגת הבדיחה או ההודעה.
- מ-Milestone 4: כפתור שני, "בדיחה אקראית מהמאגר". GET ל-/api/random, והבדיחה מוצגת באותה בועה.
- מ-Milestone 5: מתחת לבדיחת AI כפתור "צחקתי" עם מונה, שננעל אחרי לחיצה (POST ל-/api/laugh). רשימת "הכי מצחיקות" נטענת מ-/api/top בפתיחת הדף ואחרי כל צחוק. בלי polling.
- הדף מדבר רק עם /api. אין בו כתובת או מפתח של Supabase, ואין בו קישור לגיליון.
- הטקסט שחוזר מוצג עם textContent, לא innerHTML.
- רושם את sw.js כ-service worker.

### לוגיקה
- Vercel Functions בתיקיית api, כל אחת עם `export default { async fetch(request) { ... } }`. רק הן מדברות עם OpenAI, עם הגיליון ועם Supabase.
- api/joke.js (Milestones 1 עד 3):
  - מקבלת רק POST עם JSON: `{ "topic": "..." }`. מחזירה תמיד JSON: `{ "joke": "..." }` בהצלחה, `{ "error": "..." }` בשגיאה.
  - חותכת את הנושא ל-100 תווים. נושא ריק או גוף שבור נחשבים "אין נושא".
  - פונה ל-OpenAI, מחלצת את הטקסט, ומחזירה רק את הבדיחה.
  - מ-Milestone 5: שומרת את הבדיחה בטבלה `public.jokes`, ומחזירה גם `id`. אם השמירה נכשלת, הבדיחה עדיין חוזרת עם `id: null`, והשגיאה ב-console.error.
- api/random.js (Milestone 4): מורידה את הגיליון מ-`process.env.SHEET_CSV_URL`, מפענחת CSV אמיתי (פסיקים, מירכאות ושורות חדשות בתוך שדה), שומרת את השורות בזיכרון לדקה, ומחזירה שורה אקראית.
- api/laugh.js (Milestone 5): POST עם `{ "id": "..." }`. בודקת שזה uuid, וקוראת ל-`public.add_laugh` דרך rpc.
- api/top.js (Milestone 5): GET. חמש הבדיחות עם הכי הרבה צחוקים, רק עם צחוק אחד לפחות.
- lib/supabase.js (Milestone 5): לקוח אחד של `@supabase/supabase-js`, עם `process.env.SUPABASE_URL` ו-`process.env.SUPABASE_SECRET_KEY`. הוא מחוץ ל-api, כדי שלא יקבל כתובת משלו.

### נתונים
- גיליון Google (Milestone 4), לקריאה בלבד: הלשונית `jokes`, מפורסמת כ-CSV. אני עורך אותו ביד, והאתר לא כותב אליו.
- Supabase (Milestone 5): טבלה אחת, `public.jokes`, לבדיחות ה-AI ולצחוקים. רק הפונקציות ניגשות אליה, עם המפתח הסודי.
- בדיחות מהגיליון לא נשמרות ב-Supabase.

## 2. מבנה הנתונים

### הגיליון
| הכותרת | מה היא |
|---|---|
| topic | נושא הבדיחה. לא חובה |
| text | הבדיחה. שורה בלי text מדלגים עליה |

- הכותרות בשורה 1. קוראים אותן בלי תלות באותיות גדולות או קטנות, ובלי רווחים בקצוות.
- בלי מידע אישי, כי כל מי שיש לו את הקישור יכול לקרוא את הגיליון.
- עדכון בגיליון מגיע לקישור באיחור של כמה דקות, ועוד עד דקה בזיכרון של הפונקציה.

### הטבלה public.jokes
| השדה | הסוג | הערה |
|---|---|---|
| id | uuid | מפתח ראשי, `gen_random_uuid()` |
| created_at | timestamptz | `now()` |
| topic | text | הנושא שנכתב. ריק: null |
| text | text | חובה. הבדיחה |
| laughs | integer | חובה, 0 |

- RLS דולק, בלי אף policy.
- `grant select, insert, update` ל-service_role בלבד. `revoke all` מ-anon ומ-authenticated.
- `public.add_laugh(joke_id uuid)` מחזירה את המספר החדש, או null אם אין בדיחה כזו. עדכון אחד, `laughs = laughs + 1`, כדי ששני צחוקים באותו רגע לא ידרסו זה את זה. security invoker, ‏search_path ריק ושמות מלאים. ‏`revoke execute` מ-public, anon ו-authenticated, ו-`grant execute` ל-service_role.
- ה-SQL נשמר גם בקובץ `db/create_jokes.sql`, ורץ כ-migration בשם `create_jokes`.

### החוזה בין הדף לפונקציות
| הכתובת | הדף שולח | הצלחה | שגיאה |
|---|---|---|---|
| POST /api/joke | `{ "topic": "חתולים" }`, או `{ "topic": "" }` | 200, `{ "joke": "..." }`. מ-Milestone 5 גם `"id"` | 405, 500 או 502, `{ "error": "..." }` |
| GET /api/random | כלום | 200, `{ "joke": "...", "topic": "..." }` | 500 או 502, `{ "error": "..." }` |
| POST /api/laugh | `{ "id": "uuid" }` | 200, `{ "laughs": 3 }` | 400, 404, 405 או 500, `{ "error": "..." }` |
| GET /api/top | כלום | 200, `{ "jokes": [{ "id", "topic", "text", "laughs" }] }` | 500, `{ "error": "..." }` |

- כל הודעת שגיאה היא משפט קצר בעברית. הפרטים ב-console.error.
- הודעות של /api/random: חסרה כתובת: "המאגר עוד לא מחובר". הגיליון לא מפורסם כ-CSV: "הגיליון לא מפורסם כ-CSV". אין בדיחות: "המאגר ריק".
- תשובות GET חוזרות עם `Cache-Control: no-store`.

## 3. התחברות והרשאות
אין כניסה, רמה 0. כל גולש יכול לבקש בדיחה, ללחוץ "צחקתי" ולראות את "הכי מצחיקות". ההגנה על העלות היא אורך נושא מוגבל, ומגבלת הוצאה בחשבון OpenAI. ההגנה על הנתונים: הטבלה נעולה לכל תפקיד חוץ מ-service_role, ורק הפונקציות מחזיקות את המפתח הסודי.

## 4. שכבת ה-AI
- הקריאה: POST אל `https://api.openai.com/v1/responses`, מתוך הפונקציה בלבד, עם הכותרת `Authorization: Bearer <OPENAI_API_KEY>`.
- הגוף: `model` מ-OPENAI_MODEL או `gpt-5`, ‏`instructions` עם הפרומפט המרכזי, `input` עם הנושא, ‏`reasoning: { effort: "low" }` ו-`max_output_tokens`.
- הפרומפט המרכזי: "אתה כותב בדיחות קצרות בעברית. כתוב בדיחה אחת בלבד, עד ארבעה משפטים, נקייה ומתאימה לכל גיל. בלי הקדמה, בלי הסבר ובלי אימוג׳י. רק הבדיחה."
- ה-input: "נושא הבדיחה: [הנושא]". בלי נושא: "אין נושא. ספר בדיחה כללית על החיים."
- התשובה: לוקחים את `output_text` אם קיים. אחרת, את הטקסט מהפריטים מסוג `message` במערך `output`, בחלקים מסוג `output_text`. אין טקסט: שגיאה.
- שגיאה מ-OpenAI: הסטטוס והקוד נרשמים ב-console.error, והדף מקבל הודעה קצרה בעברית לפי הקוד: 401, נגמר הקרדיט, מגבלת הוצאה, 429, 404.
- לפני כתיבת הקוד בודקים בתיעוד העדכני של OpenAI ושל Vercel את מבנה הבקשה והתשובה.

## 5. אינטגרציות, APIs ואוטומציות
- OpenAI Responses API, מ-api/joke.js.
- גיליון Google מפורסם כ-CSV, מ-api/random.js. קריאה בלבד, בלי חיבור לחשבון Google.
- Supabase, דרך lib/supabase.js, מ-api/joke.js, ‏api/laugh.js ו-api/top.js.
- אין אוטומציות.

## 6. מפתחות וסודות
| השם | איפה | סוג | מה הוא |
|---|---|---|---|
| OPENAI_API_KEY | Vercel, Environment Variables, ב-Production וב-Preview | Secret | מפתח ה-production, ‏joke-in-a-click. רק הפונקציה קוראת אותו |
| OPENAI_API_KEY | .env.local במחשב, רק בהרצה מקומית | קובץ שלא נכנס לריפו | מפתח dev נפרד, ‏joke-in-a-click-dev. הסטודנט מדביק אותו ביד |
| OPENAI_MODEL | Vercel, Environment Variables | Config, לא חובה | שם המודל. בלי המשתנה: gpt-5 |
| SHEET_CSV_URL | Vercel, ב-Production וב-Preview | Config | הקישור של הגיליון שמפורסם כ-CSV. רק api/random.js קורא אותו (Milestone 4) |
| SUPABASE_URL | Vercel, ב-Production וב-Preview | Config | כתובת הפרויקט ב-Supabase. רק lib/supabase.js קורא אותה (Milestone 5) |
| SUPABASE_SECRET_KEY | Vercel, ב-Production וב-Preview | Secret | המפתח הסודי של Supabase. רק lib/supabase.js קורא אותו (Milestone 5) |

- המפתחות לא מופיעים בשום קובץ שנכנס לריפו, ולא בצ׳אט עם Claude. היחיד: .env.local במחשב, למי שמריץ מקומית.
- קישור העריכה של הגיליון ניתן ל-Claude בצ׳אט רק כדי לקרוא את המבנה, ולא נשמר באף קובץ.
- מפתח ה-production נשמר ב-Vercel כבר ב-Milestone 1. אחרי כל שינוי במשתנה: Redeploy.
- .claude/settings.json חוסם ל-Claude את הקריאה של .env ושל .env.*. בריפו יש .env.example עם שתי שורות בלבד: `OPENAI_API_KEY=` ו-`SUPABASE_SECRET_KEY=`, בלי ערכים ובלי הערות. שם המודל לא נכנס לקובץ: בלי OPENAI_MODEL הקוד משתמש ב-gpt-5.
- הרצה מקומית מ-Milestone 4: מוסיפים ביד ל-.env.local גם את SHEET_CSV_URL, ומ-Milestone 5 גם את SUPABASE_URL ואת SUPABASE_SECRET_KEY. ביד, לא דרך Claude.
- הדפדפן לא מקבל אף מפתח. הוא פונה רק ל-/api.
- .gitignore כולל `.env`, ‏`.env.*`, את החריגה `!.env.example`, ‏`.vercel` ו-`node_modules`. הוא נוצר לפני הקומיט הראשון.
- בחשבון OpenAI: קרדיט מראש, Auto recharge כבוי, ומגבלת הוצאה חודשית.

## 7. מבנה התיקיות של הקוד
```
index.html              המסך, עם ה-CSS וה-JavaScript
manifest.webmanifest    name, short_name, start_url, display: standalone, lang: he, dir: rtl, אייקונים
sw.js                   service worker, network-first, בלי /api
package.json            "type": "module". מ-Milestone 5: @supabase/supabase-js ב-dependencies
.gitignore              .env, .env.*, !.env.example, .vercel, node_modules
.env.example            OPENAI_API_KEY= ו-SUPABASE_SECRET_KEY=, בלי ערכים ובלי הערות
.claude/settings.json   חוסם ל-Claude את הקריאה של .env ושל .env.*
assets/logo.svg
assets/mascot-idle.svg, mascot-think.svg, mascot-joke.svg, mascot-error.svg
assets/bg-dots.svg, bg-doodles.svg
assets/icon.svg, icon-maskable.svg
assets/icon-192.png, icon-512.png, icon-512-maskable.png
api/joke.js             בדיחה מ-AI. המקום היחיד שקורא את OPENAI_API_KEY. מ-Milestone 5 גם שומרת
api/random.js           בדיחה אקראית מהגיליון (Milestone 4)
api/laugh.js            "צחקתי", דרך add_laugh (Milestone 5)
api/top.js              חמש הכי מצחיקות (Milestone 5)
lib/supabase.js         הלקוח היחיד של Supabase. המקום היחיד שקורא את SUPABASE_SECRET_KEY (Milestone 5)
db/create_jokes.sql     ה-SQL של ה-migration create_jokes (Milestone 5)
spec/                   מסמכי האיפיון, ו-spec/plans
```

ה-service worker:
- באירוע install שומר במטמון את /, את ה-manifest, את קבצי ה-SVG מתיקיית assets ואת שני האייקונים.
- בכל בקשת GET מאותה כתובת: קודם רשת, ושומר עותק. אין רשת: מחזיר מהמטמון.
- בקשה ל-/api, בקשה שאינה GET, או בקשה לכתובת אחרת: לא נוגע בה.
- בכל Milestone שמשנה את האתר הגרסה בשם המטמון עולה: `joke-v1` ב-Milestone 3, ‏`joke-v2` ב-Milestone 4, ‏`joke-v3` ב-Milestone 5. באירוע activate נמחקים המטמונים הישנים.

## הנחות והחלטות
- בלי ai-tests.md. במקומו, חמש בדיקות ידניות בתנאי ההשלמה של Milestone 2. המוצר קטן, והפלט הוא טקסט חופשי.
- שני גופנים מ-Google Fonts, Fredoka ו-Playpen Sans Hebrew, עם גיבוי ל-system-ui. ה-service worker לא שומר אותם, כי הם מכתובת אחרת.
- CSS ו-JavaScript בתוך index.html, כי יש מסך אחד.
- `reasoning: { effort: "low" }` כדי שהבדיחה תחזור מהר. אם התיעוד העדכני לא תומך בשדה הזה במודל שנבחר, מורידים אותו.
- הפונקציה כותבת console.log קצר לכל בדיחה (הנושא והמודל), כדי לראות פניות ב-Logs.
- Milestone 4: פענוח ה-CSV נכתב ביד, בלי ספרייה, כי זה פענוח קצר והסטאק לא מוסיף ספרייה שאפשר לוותר עליה.
- Milestone 4: הזיכרון לדקה הוא משתנה ברמת המודול בפונקציה. מופע חדש של הפונקציה מתחיל בלי זיכרון, וזה בסדר.
- Milestone 5: טבלה אחת מספיקה. בדיחות מהגיליון לא נשמרות, ולכן אין להן "צחקתי".
- Milestone 5: "צחקתי" ננעל בדף אחרי לחיצה אחת. אין מניעה בשרת מלחיצות חוזרות, כי אין כניסה (רמה 0).

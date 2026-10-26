-- Milestone 5: migration restrict_jokes_service_role
-- ברירת המחדל של Supabase נתנה ל-service_role גם delete, truncate, references ו-trigger.
-- לפי ה-spec מגיע לו רק select, insert, update.

revoke delete, truncate, references, trigger on table public.jokes from service_role;

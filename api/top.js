// Milestone 5: חמש הבדיחות עם הכי הרבה צחוקים, רק עם צחוק אחד לפחות.
import { supabase } from '../lib/supabase.js';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return json({ error: 'אפשר לשלוח רק GET.' }, 405);
    }

    const failed = { error: 'הרשימה לא זמינה כרגע. נסו שוב עוד רגע.' };
    if (!supabase) return json(failed, 500);

    const { data, error } = await supabase
      .from('jokes')
      .select('id, topic, text, laughs')
      .gte('laughs', 1)
      .order('laughs', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error(`top failed: code=${error.code}, message=${error.message}`);
      return json(failed, 500);
    }

    return json({ jokes: data });
  },
};

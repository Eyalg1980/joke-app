// Milestone 5: "צחקתי". מעלה את המונה באחד דרך public.add_laugh.
import { supabase } from '../lib/supabase.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ERRORS = {
  notFound: 'הבדיחה לא נמצאה.',
  general: 'הצחוקים לא זמינים כרגע. נסו שוב עוד רגע.',
};

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'אפשר לשלוח רק POST.' }, { status: 405 });
    }

    let id = '';
    try {
      const body = await request.json();
      if (typeof body?.id === 'string') id = body.id.trim();
    } catch {}

    if (!UUID.test(id)) {
      return Response.json({ error: ERRORS.notFound }, { status: 400 });
    }

    if (!supabase) {
      return Response.json({ error: ERRORS.general }, { status: 500 });
    }

    const { data, error } = await supabase.rpc('add_laugh', { joke_id: id });
    if (error) {
      console.error(`add_laugh failed: code=${error.code}, message=${error.message}`);
      return Response.json({ error: ERRORS.general }, { status: 500 });
    }
    if (data === null) {
      return Response.json({ error: ERRORS.notFound }, { status: 404 });
    }

    console.log(`laugh: id=${id}, laughs=${data}`);
    return Response.json({ laughs: data });
  },
};

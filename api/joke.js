// Milestone 1: Walking Skeleton. עדיין בלי AI.
// הפונקציה רק בודקת אם המפתח קיים, ולעולם לא מחזירה אותו.

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return Response.json({ error: 'אפשר לשלוח רק POST.' }, { status: 405 });
    }

    // גוף שבור או נושא שאינו טקסט נחשבים "אין נושא"
    let topic = '';
    try {
      const body = await request.json();
      if (typeof body?.topic === 'string') topic = body.topic.trim().slice(0, 100);
    } catch {}

    const keyStatus = process.env.OPENAI_API_KEY ? 'נמצא' : 'חסר';
    console.log(`joke request: topic="${topic}", key=${keyStatus}`);

    return Response.json({
      joke: `בדיחה זמנית מהשרת: ${topic || 'בלי נושא'}. המפתח: ${keyStatus}`,
    });
  },
};

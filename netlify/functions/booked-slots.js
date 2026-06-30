const { getStore } = require('@netlify/blobs');

const HEADERS = { 'Content-Type': 'application/json' };

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS };
  }

  const store = getStore('bookings');

  // GET — return current booked slots
  if (event.httpMethod === 'GET') {
    try {
      const slots = await store.get('booked-slots', { type: 'json' });
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify(slots || []) };
    } catch {
      return { statusCode: 200, headers: HEADERS, body: '[]' };
    }
  }

  // POST — register a newly booked slot
  if (event.httpMethod === 'POST') {
    try {
      const { slot } = JSON.parse(event.body || '{}');
      if (!slot) {
        return { statusCode: 400, headers: HEADERS, body: '{"error":"missing slot"}' };
      }

      let slots = [];
      try {
        slots = (await store.get('booked-slots', { type: 'json' })) || [];
      } catch { /* first booking — store is empty */ }

      if (!slots.includes(slot)) {
        slots.push(slot);
        await store.setJSON('booked-slots', slots);
      }

      return { statusCode: 200, headers: HEADERS, body: '{"ok":true}' };
    } catch (err) {
      console.error('booked-slots error:', err);
      return { statusCode: 500, headers: HEADERS, body: '{"error":"internal"}' };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};

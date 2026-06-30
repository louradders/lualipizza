const { getStore } = require('@netlify/blobs');

const HEADERS = { 'Content-Type': 'application/json' };

async function getData(store) {
  try {
    return (await store.get('bookings-data', { type: 'json' })) || { slots: [], closed: false };
  } catch {
    return { slots: [], closed: false };
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS };
  }

  const store = getStore('bookings');

  // GET — return current state
  if (event.httpMethod === 'GET') {
    const data = await getData(store);
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify(data) };
  }

  // POST — mark a slot taken, or set closed state
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const data = await getData(store);

      if ('slot' in body) {
        if (!data.slots.includes(body.slot)) data.slots.push(body.slot);
      }

      if ('closed' in body) {
        data.closed = !!body.closed;
      }

      await store.setJSON('bookings-data', data);
      return { statusCode: 200, headers: HEADERS, body: '{"ok":true}' };
    } catch (err) {
      console.error('booked-slots error:', err);
      return { statusCode: 500, headers: HEADERS, body: '{"error":"internal"}' };
    }
  }

  // DELETE — unbook a slot
  if (event.httpMethod === 'DELETE') {
    try {
      const { slot } = JSON.parse(event.body || '{}');
      if (!slot) {
        return { statusCode: 400, headers: HEADERS, body: '{"error":"missing slot"}' };
      }

      const data = await getData(store);
      data.slots = data.slots.filter(s => s !== slot);
      await store.setJSON('bookings-data', data);

      return { statusCode: 200, headers: HEADERS, body: '{"ok":true}' };
    } catch (err) {
      console.error('booked-slots delete error:', err);
      return { statusCode: 500, headers: HEADERS, body: '{"error":"internal"}' };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};

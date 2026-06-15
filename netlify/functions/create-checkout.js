exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { amount, reference, description } = body;

  if (!amount || amount <= 0) {
    return { statusCode: 400, body: 'Invalid amount' };
  }

  const resp = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUMUP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      checkout_reference: reference || `LUALI-${Date.now()}`,
      amount: parseFloat(amount.toFixed(2)),
      currency: 'GBP',
      description: description || 'Luali Pizza Order',
    }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    console.error('SumUp error:', data);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create checkout' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: data.id }),
  };
};

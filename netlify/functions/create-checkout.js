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

  const authHeader = { 'Authorization': `Bearer ${process.env.SUMUP_API_KEY}` };

  // Fetch merchant code from SumUp account
  const meResp = await fetch('https://api.sumup.com/v0.1/me', {
    headers: authHeader,
  });
  const meData = await meResp.json();

  if (!meResp.ok) {
    console.error('SumUp /me error:', meData);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to authenticate with SumUp' }),
    };
  }

  const merchantCode = meData.merchant_profile?.merchant_code;

  if (!merchantCode) {
    console.error('No merchant code found in:', meData);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Merchant code not found' }),
    };
  }

  // Create the checkout
  const resp = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      checkout_reference: reference || `LUALI-${Date.now()}`,
      amount: parseFloat(amount.toFixed(2)),
      currency: 'GBP',
      description: description || 'Luali Pizza Order',
      merchant_code: merchantCode,
    }),
  });

  const data = await resp.json();
  console.log('SumUp checkout response:', JSON.stringify(data));

  if (!resp.ok) {
    console.error('SumUp checkout error:', data);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create checkout' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
};

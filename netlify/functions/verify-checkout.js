exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const checkoutId = event.queryStringParameters && event.queryStringParameters.id;

  if (!checkoutId) {
    return { statusCode: 400, body: 'Missing checkout id' };
  }

  const resp = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
    headers: { 'Authorization': `Bearer ${process.env.SUMUP_API_KEY}` },
  });

  const data = await resp.json();

  if (!resp.ok) {
    console.error('SumUp verify-checkout error:', data);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to verify checkout' }),
    };
  }

  console.log('SumUp verify-checkout response:', JSON.stringify(data));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: data.status, transactions: data.transactions }),
  };
};

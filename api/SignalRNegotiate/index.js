module.exports = async function (context, req, connectionInfo) {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-signalr-user-agent, x-requested-with',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: corsHeaders,
      body: ''
    };
    return;
  }

  try {
    // Return SignalR connection info to client
    context.res = {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: connectionInfo
    };
  } catch (error) {
    context.log('SignalR negotiate error:', error);
    context.res = {
      status: 500,
      headers: corsHeaders,
      body: { error: 'Failed to negotiate SignalR connection' }
    };
  }
};

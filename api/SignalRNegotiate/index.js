module.exports = async function (context, req, connectionInfo) {
  // Determine the origin
  const origin = req.headers.origin || req.headers.Origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173', 
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'https://kind-smoke-0a58c5010.2.azurestaticapps.net'
  ];
  
  const corsOrigin = allowedOrigins.includes(origin) ? origin : 'http://localhost:5173';

  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
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

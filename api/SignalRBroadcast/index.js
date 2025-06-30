module.exports = async function (context, req) {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-signalr-user-agent, x-requested-with',
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

  const { userId, type, data } = req.body;

  if (!userId || !type || !data) {
    context.res = {
      status: 400,
      headers: corsHeaders,
      body: { error: 'Missing required fields: userId, type, data' }
    };
    return;
  }

  let message = {};

  switch (type) {
    case 'mood_update':
      message = {
        target: 'MoodUpdated',
        arguments: [data]
      };
      break;
    
    case 'stats_update':
      message = {
        target: 'StatsUpdated',
        arguments: [data]
      };
      break;
    
    case 'notification':
      message = {
        target: 'NotificationReceived',
        arguments: [data]
      };
      break;
    
    default:
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { error: 'Invalid message type' }
      };
      return;
  }

  // Send to ALL connected clients (no group filter)
  context.bindings.signalRMessages = [message];

  context.res = {
    status: 200,
    headers: corsHeaders,
    body: { message: 'Broadcast sent successfully' }
  };
};

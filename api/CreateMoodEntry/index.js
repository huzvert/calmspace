const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = "calmspace-db";
const containerId = "moodEntries";
const usersContainerId = "users";

const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
  // Set CORS headers
  context.res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  const { mood, userId, timestamp, note } = req.body;

  if (!mood || !userId || !timestamp) {
    context.res = {
      ...context.res,
      status: 400,
      body: "Missing required fields: mood, userId, and timestamp are required.",
    };
    return;
  }

  try {
    const container = client.database(databaseId).container(containerId);

    const newEntry = {
      id: `${userId}-${Date.now()}`,
      mood,
      userId,
      timestamp,
      ...(note && { note }) // Include note only if provided
    };

    await container.items.create(newEntry);

    // Fetch username for the notification
    let username = "Someone";
    try {
      context.log('Fetching username for userId:', userId);
      const usersContainer = client.database(databaseId).container(usersContainerId);
      
      // Try to get user by ID first
      try {
        const { resource: user } = await usersContainer.item(userId, userId).read();
        if (user) {
          context.log('Found user by ID:', { id: user.id, username: user.username, name: user.name });
          if (user.username) {
            username = user.username;
            context.log('Using username:', username);
          } else if (user.name) {
            username = user.name.split(' ')[0];
            context.log('Using first name:', username);
          }
        }
      } catch (notFoundError) {
        context.log('User not found by ID, searching by userId field...');
        
        // If not found by ID, try querying by userId field
        const userQuery = {
          query: "SELECT * FROM c WHERE c.id = @userId OR c.userId = @userId",
          parameters: [{ name: "@userId", value: userId }]
        };
        
        const { resources: users } = await usersContainer.items.query(userQuery).fetchAll();
        
        if (users.length > 0) {
          const user = users[0];
          context.log('Found user by query:', { id: user.id, username: user.username, name: user.name });
          if (user.username) {
            username = user.username;
            context.log('Using username:', username);
          } else if (user.name) {
            username = user.name.split(' ')[0];
            context.log('Using first name:', username);
          }
        } else {
          context.log('No user found for userId:', userId);
        }
      }
    } catch (userFetchError) {
      context.log('Could not fetch username for notification:', userFetchError.message);
      context.log('Error details:', userFetchError);
    }

    // Send real-time update via SignalR to ALL connected clients
    try {
      context.bindings.signalRMessages = [{
        target: 'moodupdated',
        arguments: [{
          mood,
          timestamp,
          userId,
          note,
          message: `🎉 ${username} logged: ${mood}${note ? ' with a note' : ''}`,
          id: newEntry.id
        }]
      }];
      context.log('SignalR mood update sent to all clients with username:', username);
    } catch (signalRError) {
      context.log('SignalR broadcast error:', signalRError.message);
    }

    context.res = {
      ...context.res,
      status: 201,
      body: { message: "Mood entry created", entry: newEntry },
    };
  } catch (error) {
    context.log("Error:", error.message);
    context.res = {
      ...context.res,
      status: 500,
      body: "Internal Server Error",
    };
  }
};

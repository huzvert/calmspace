const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = "calmspace-db";
const containerId = "userSettings";

const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
  // Set CORS headers
  context.res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  const userId = req.query.userId;

  if (!userId) {
    context.res = {
      ...context.res,
      status: 400,
      body: { error: "Missing userId parameter" },
    };
    return;
  }

  try {
    const container = client.database(databaseId).container(containerId);

    try {
      // Try to get existing settings
      const { resource: settings } = await container.item(userId, userId).read();
      
      context.res = {
        ...context.res,
        status: 200,
        body: settings
      };
    } catch (notFoundError) {
      // If settings don't exist, return default settings
      const defaultSettings = {
        id: userId,
        userId: userId,
        displayName: "",
        reminderTime: "08:00",
        darkMode: false,
        notificationsEnabled: true
      };

      context.res = {
        ...context.res,
        status: 200,
        body: defaultSettings
      };
    }
  } catch (error) {
    context.log("Error fetching user settings:", error.message);
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Failed to fetch user settings" },
    };
  }
};

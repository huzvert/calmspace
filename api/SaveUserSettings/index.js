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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  const { userId, displayName, reminderTime, darkMode, notificationsEnabled } = req.body;

  if (!userId) {
    context.res = {
      ...context.res,
      status: 400,
      body: { error: "Missing userId" },
    };
    return;
  }

  try {
    const container = client.database(databaseId).container(containerId);

    const settingsDocument = {
      id: userId,
      userId: userId,
      displayName: displayName || "",
      reminderTime: reminderTime || "08:00",
      darkMode: darkMode || false,
      notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : true,
      updatedAt: new Date().toISOString()
    };

    // Upsert the settings (create or update)
    const { resource: savedSettings } = await container.items.upsert(settingsDocument);

    context.res = {
      ...context.res,
      status: 200,
      body: { 
        message: "Settings saved successfully", 
        settings: savedSettings 
      },
    };
  } catch (error) {
    context.log("Error saving user settings:", error.message);
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Failed to save user settings" },
    };
  }
};

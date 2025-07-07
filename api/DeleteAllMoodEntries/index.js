const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = "calmspace-db";
const containerId = "moodEntries";

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

  const { userId } = req.body;

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

    // Get all mood entries for the user
    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId",
      parameters: [{ name: "@userId", value: userId }],
    };

    const { resources: entries } = await container.items.query(query).fetchAll();

    let deletedCount = 0;

    // Delete each entry
    for (const entry of entries) {
      try {
        await container.item(entry.id, entry.userId).delete();
        deletedCount++;
      } catch (deleteError) {
        context.log(`Failed to delete entry ${entry.id}:`, deleteError.message);
      }
    }

    context.res = {
      ...context.res,
      status: 200,
      body: { 
        message: `Successfully deleted ${deletedCount} mood entries`,
        deletedCount: deletedCount
      },
    };
  } catch (error) {
    context.log("Error deleting mood entries:", error.message);
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Failed to delete mood entries" },
    };
  }
};

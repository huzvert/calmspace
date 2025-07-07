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
  const date = req.query.date; // Optional date filter (YYYY-MM-DD format)
  const limit = parseInt(req.query.limit) || 50; // Default to 50 entries
  const offset = parseInt(req.query.offset) || 0; // For pagination

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

    let query;
    if (date) {
      // Filter by specific date
      query = {
        query: `SELECT * FROM c WHERE c.userId = @userId AND STARTSWITH(c.timestamp, @date) ORDER BY c.timestamp DESC OFFSET @offset LIMIT @limit`,
        parameters: [
          { name: "@userId", value: userId },
          { name: "@date", value: date },
          { name: "@offset", value: offset },
          { name: "@limit", value: limit }
        ],
      };
    } else {
      // Get all entries for the user with pagination
      query = {
        query: `SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC OFFSET @offset LIMIT @limit`,
        parameters: [
          { name: "@userId", value: userId },
          { name: "@offset", value: offset },
          { name: "@limit", value: limit }
        ],
      };
    }

    const { resources: results } = await container.items.query(query).fetchAll();

    // Format the entries for frontend consumption
    const formattedEntries = results.map(entry => ({
      id: entry.id,
      mood: entry.mood,
      timestamp: entry.timestamp,
      note: entry.note || null,
      date: entry.timestamp.split('T')[0] // Extract date part for grouping
    }));

    context.res = {
      ...context.res,
      status: 200,
      body: {
        entries: formattedEntries,
        total: results.length,
        offset,
        limit,
        hasMore: results.length === limit // Simple check if there might be more
      }
    };
  } catch (error) {
    context.log("Error fetching mood history:", error.message);
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Failed to fetch mood history" },
    };
  }
};

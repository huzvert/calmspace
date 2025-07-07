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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  const userId = req.query.userId || req.body?.userId;
  const date = req.query.date; // Optional date filter (YYYY-MM-DD format)
  const includeEntries = req.query.includeEntries === 'true'; // Whether to return individual entries

  if (!userId) {
    context.res = {
      ...context.res,
      status: 400,
      body: "Missing userId",
    };
    return;
  }

  try {
    const container = client.database(databaseId).container(containerId);

    let query;
    if (date) {
      // Filter by specific date
      query = {
        query: "SELECT * FROM c WHERE c.userId = @userId AND STARTSWITH(c.timestamp, @date) ORDER BY c.timestamp DESC",
        parameters: [
          { name: "@userId", value: userId },
          { name: "@date", value: date }
        ],
      };
    } else {
      // Get all entries for the user
      query = {
        query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC",
        parameters: [{ name: "@userId", value: userId }],
      };
    }

    const { resources: results } = await container.items.query(query).fetchAll();

    // Process the results to calculate statistics
    const moodCounts = {};
    const uniqueDates = new Set();
    const positiveDaysSet = new Set();

    results.forEach(entry => {
      // Handle different timestamp formats
      let date;
      if (typeof entry.timestamp === 'string' && entry.timestamp.includes('T')) {
        // ISO string format: "2025-01-24T10:30:45.123Z"
        date = entry.timestamp.split('T')[0];
      } else {
        // Fallback: convert to Date and extract date part
        const dateObj = new Date(entry.timestamp);
        date = dateObj.toISOString().split('T')[0];
      }
      
      uniqueDates.add(date);

      // Normalize mood to lowercase for consistent comparison
      const normalizedMood = entry.mood.toLowerCase();
      moodCounts[normalizedMood] = (moodCounts[normalizedMood] || 0) + 1;

      // Check for positive moods (happy, calm) and track unique positive days
      if (['happy', 'calm'].includes(normalizedMood)) {
        positiveDaysSet.add(date);
      }
    });

    const mostCommonMood = Object.entries(moodCounts).reduce((a, b) => a[1] > b[1] ? a : b, [null, 0])[0];
    const daysTracked = uniqueDates.size;
    const positiveDaysPercentage = daysTracked > 0 ? Math.round((positiveDaysSet.size / daysTracked) * 100) : 0;

    const response = {
      daysTracked,
      mostCommonMood: mostCommonMood || 'None',
      positiveDaysPercentage
    };

    // Include individual entries if requested
    if (includeEntries) {
      response.entries = results.map(entry => ({
        id: entry.id,
        mood: entry.mood,
        timestamp: entry.timestamp,
        note: entry.note || null
      }));
    }

    context.res = {
      ...context.res,
      status: 200,
      body: response
    };
  } catch (error) {
    context.log("Error:", error.message);
    context.res = {
      ...context.res,
      status: 500,
      body: "Failed to fetch mood stats",
    };
  }
};

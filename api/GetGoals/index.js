const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = "calmspace-db";
const containerId = "moodGoals";

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
    const database = client.database(databaseId);
    
    // Create container if it doesn't exist
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: {
        paths: ["/userId"]
      }
    });

    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt ASC",
      parameters: [{ name: "@userId", value: userId }],
    };

    const { resources: goals } = await container.items.query(query).fetchAll();

    context.res = {
      ...context.res,
      status: 200,
      body: { 
        goals: goals.map(goal => ({
          id: goal.id,
          title: goal.goalName,
          target: goal.target,
          current: goal.progress,
          completed: goal.completed,
          createdAt: goal.createdAt,
          updatedAt: goal.updatedAt
        }))
      },
    };
  } catch (error) {
    context.log("Error fetching goals:", error.message);
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Failed to fetch goals" },
    };
  }
};

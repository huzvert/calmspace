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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  const goalId = req.query.goalId || req.body?.goalId;
  const userId = req.query.userId || req.body?.userId;

  if (!goalId || !userId) {
    context.res = {
      ...context.res,
      status: 400,
      body: { error: "Missing required parameters: goalId, userId" },
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

    // First, fetch the existing goal to verify ownership
    const { resource: existingGoal } = await container.item(goalId, userId).read();
    
    if (!existingGoal) {
      context.res = {
        ...context.res,
        status: 404,
        body: { error: "Goal not found" },
      };
      return;
    }

    if (existingGoal.userId !== userId) {
      context.res = {
        ...context.res,
        status: 403,
        body: { error: "Unauthorized to delete this goal" },
      };
      return;
    }

    // Delete the goal
    await container.item(goalId, userId).delete();

    context.res = {
      ...context.res,
      status: 200,
      body: { message: "Goal deleted successfully" },
    };
  } catch (error) {
    context.log("Error deleting goal:", error.message);
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Failed to delete goal" },
    };
  }
};

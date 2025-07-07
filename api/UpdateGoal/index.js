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

  const { goalId, progress, userId } = req.body;

  if (!goalId || progress === undefined || !userId) {
    context.res = {
      ...context.res,
      status: 400,
      body: { error: "Missing required fields: goalId, progress, userId" },
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
        body: { error: "Unauthorized to update this goal" },
      };
      return;
    }

    // Update the goal
    const updatedGoal = {
      ...existingGoal,
      progress: parseInt(progress),
      completed: parseInt(progress) >= existingGoal.target,
      updatedAt: new Date().toISOString()
    };

    const { resource: savedGoal } = await container.item(goalId, userId).replace(updatedGoal);

    context.res = {
      ...context.res,
      status: 200,
      body: { 
        message: "Goal updated successfully", 
        goal: {
          id: savedGoal.id,
          title: savedGoal.goalName,
          target: savedGoal.target,
          current: savedGoal.progress,
          completed: savedGoal.completed,
          createdAt: savedGoal.createdAt,
          updatedAt: savedGoal.updatedAt
        }
      },
    };
  } catch (error) {
    context.log("Error updating goal:", error.message);
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Failed to update goal" },
    };
  }
};

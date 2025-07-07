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

  const { userId, goalName, target, progress = 0 } = req.body;

  if (!userId || !goalName || target === undefined) {
    context.res = {
      ...context.res,
      status: 400,
      body: { error: "Missing required fields: userId, goalName, target" },
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

    const newGoal = {
      id: `goal-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      goalName: goalName.trim(),
      target: parseInt(target),
      progress: parseInt(progress),
      completed: parseInt(progress) >= parseInt(target),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { resource: createdGoal } = await container.items.create(newGoal);

    context.res = {
      ...context.res,
      status: 201,
      body: { 
        message: "Goal created successfully", 
        goal: createdGoal 
      },
    };
  } catch (error) {
    context.log("Error creating goal:", error.message);
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Failed to create goal" },
    };
  }
};

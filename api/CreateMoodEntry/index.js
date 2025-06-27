const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = "calmspace-db";
const containerId = "moodEntries";

const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
  const { mood, userId, timestamp } = req.body;

  if (!mood || !userId || !timestamp) {
    context.res = {
      status: 400,
      body: "Missing required fields.",
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
    };

    await container.items.create(newEntry);

    context.res = {
      status: 201,
      body: { message: "Mood entry created", entry: newEntry },
    };
  } catch (error) {
    context.log("Error:", error.message);
    context.res = {
      status: 500,
      body: "Internal Server Error",
    };
  }
};

const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = "calmspace-db";
const containerId = "moodEntries";

const client = new CosmosClient({ endpoint, key });

module.exports = async function (context, req) {
  const userId = req.query.userId || req.body?.userId;

  if (!userId) {
    context.res = {
      status: 400,
      body: "Missing userId",
    };
    return;
  }

  try {
    const container = client.database(databaseId).container(containerId);

    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId",
      parameters: [{ name: "@userId", value: userId }],
    };

    const { resources: results } = await container.items.query(query).fetchAll();

    context.res = {
      status: 200,
      body: results,
    };
  } catch (error) {
    context.log("Error:", error.message);
    context.res = {
      status: 500,
      body: "Failed to fetch mood stats",
    };
  }
};

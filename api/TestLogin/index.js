const { CosmosClient } = require("@azure/cosmos");
const bcrypt = require("bcryptjs");

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = "calmspace-db";
const containerId = "users";

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

  try {
    context.log("Test endpoint hit");
    
    const database = client.database(databaseId);
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { path: "/id" }
    });

    // Get all users for debugging
    const { resources: allUsers } = await container.items.readAll().fetchAll();
    context.log("All users in database:", allUsers.length);
    
    for (const user of allUsers) {
      context.log("User:", { 
        id: user.id, 
        email: user.email, 
        username: user.username,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      });
    }

    context.res = {
      ...context.res,
      status: 200,
      body: {
        message: "Test successful",
        userCount: allUsers.length,
        users: allUsers.map(u => ({
          id: u.id,
          email: u.email,
          username: u.username,
          name: u.name,
          createdAt: u.createdAt
        }))
      }
    };
  } catch (error) {
    context.log("Test error:", error.message);
    context.log("Stack:", error.stack);
    
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Test failed", details: error.message }
    };
  }
};

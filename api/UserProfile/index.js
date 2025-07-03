const { CosmosClient } = require("@azure/cosmos");
const jwt = require("jsonwebtoken");

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = "calmspace-db";
const containerId = "users";
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

const client = new CosmosClient({ endpoint, key });

// Helper function to verify JWT token
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header');
  }
  
  const token = authHeader.substring(7);
  return jwt.verify(token, JWT_SECRET);
}

module.exports = async function (context, req) {
  // Set CORS headers
  context.res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  try {
    // Verify JWT token
    const decoded = verifyToken(req.headers.authorization);
    const userId = decoded.userId;

    const database = client.database(databaseId);
    
    // Create container if it doesn't exist
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { path: "/id" }
    });

    if (req.method === 'GET') {
      // Get user profile
      const { resource: user } = await container.item(userId, userId).read();
      
      if (!user) {
        context.res = {
          ...context.res,
          status: 404,
          body: { error: "User not found" },
        };
        return;
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      context.res = {
        ...context.res,
        status: 200,
        body: { user: userWithoutPassword },
      };
    } 
    else if (req.method === 'PUT') {
      // Update user profile
      const { name, avatar, preferences } = req.body;
      
      const { resource: existingUser } = await container.item(userId, userId).read();
      
      if (!existingUser) {
        context.res = {
          ...context.res,
          status: 404,
          body: { error: "User not found" },
        };
        return;
      }

      // Update user data
      const updatedUser = {
        ...existingUser,
        ...(name && { name: name.trim() }),
        ...(avatar && { avatar }),
        ...(preferences && { preferences: { ...existingUser.preferences, ...preferences } }),
        updatedAt: new Date().toISOString()
      };

      await container.item(userId, userId).replace(updatedUser);

      // Return updated user without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      context.res = {
        ...context.res,
        status: 200,
        body: { 
          message: "Profile updated successfully",
          user: userWithoutPassword 
        },
      };
    }
  } catch (error) {
    context.log("Profile error:", error.message);
    
    if (error.name === 'JsonWebTokenError' || error.message.includes('authorization')) {
      context.res = {
        ...context.res,
        status: 401,
        body: { error: "Invalid or expired token" },
      };
    } else {
      context.res = {
        ...context.res,
        status: 500,
        body: { error: "Internal server error" },
      };
    }
  }
};

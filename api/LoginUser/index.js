const { CosmosClient } = require("@azure/cosmos");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const endpoint = process.env.COSMOS_DB_URI;
const key = process.env.COSMOS_DB_KEY;
const databaseId = "calmspace-db";
const containerId = "users";
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

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

  const { email, password, username, emailOrUsername } = req.body;

  // Handle both old and new format
  const loginIdentifier = emailOrUsername || email || username;

  if (!loginIdentifier || !password) {
    context.res = {
      ...context.res,
      status: 400,
      body: { error: "Login identifier and password are required" },
    };
    return;
  }

  try {
    context.log("Login attempt for:", loginIdentifier);
    context.log("Environment check - DB URI exists:", !!endpoint);
    context.log("Environment check - DB Key exists:", !!key);
    
    if (!endpoint || !key) {
      throw new Error("Missing Cosmos DB configuration");
    }
    
    const database = client.database(databaseId);
    
    // Create container if it doesn't exist
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { path: "/id" }
    });

    // Find user by email or username
    const isEmail = loginIdentifier.includes('@');
    
    context.log("Login type:", isEmail ? "email" : "username");
    context.log("Looking for identifier:", loginIdentifier.toLowerCase());
    
    const query = {
      query: isEmail 
        ? "SELECT * FROM c WHERE c.email = @identifier"
        : "SELECT * FROM c WHERE c.username = @identifier",
      parameters: [{ name: "@identifier", value: loginIdentifier.toLowerCase() }],
    };

    const { resources: users } = await container.items.query(query).fetchAll();
    context.log("Users found:", users.length);
    context.log("Query used:", JSON.stringify(query));
    
    if (users.length === 0) {
      context.log("No user found with identifier:", loginIdentifier);
      context.res = {
        ...context.res,
        status: 401,
        body: { error: "Invalid login credentials" },
      };
      return;
    }

    const user = users[0];
    context.log("Found user:", { id: user.id, email: user.email, username: user.username });
    context.log("User has password field:", !!user.password);
    context.log("Password field length:", user.password ? user.password.length : 0);

    // Check password
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      context.log("Password valid:", isPasswordValid);
      context.log("Provided password length:", password.length);
    } catch (bcryptError) {
      context.log("Bcrypt error:", bcryptError.message);
      context.res = {
        ...context.res,
        status: 500,
        body: { error: "Password verification failed", details: bcryptError.message },
      };
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      context.res = {
        ...context.res,
        status: 401,
        body: { error: "Invalid login credentials" },
      };
      return;
    }

    // Update last login time
    const updatedUser = {
      ...user,
      lastLoginAt: new Date().toISOString()
    };

    try {
      await container.item(user.id, user.id).replace(updatedUser);
      context.log("User last login updated successfully");
    } catch (updateError) {
      context.log("Error updating user last login:", updateError.message);
      // Continue with login even if update fails
    }

    // Generate JWT token
    const tokenPayload = { 
      userId: user.id, 
      email: user.email,
      name: user.name,
      username: user.username
    };
    
    context.log("Creating JWT with payload:", tokenPayload);
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    
    context.log("JWT created successfully");

    // Return user info (without password) and token
    const { password: _, ...userWithoutPassword } = updatedUser;

    context.res = {
      ...context.res,
      status: 200,
      body: {
        message: "Login successful",
        user: userWithoutPassword,
        token: token
      },
    };
  } catch (error) {
    context.log("Login error:", error.message);
    context.log("Stack trace:", error.stack);
    
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
        body: { error: "Internal server error during login", details: error.message },
      };
    }
  }
};

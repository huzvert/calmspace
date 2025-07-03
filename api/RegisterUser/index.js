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

  const { email, password, name, username, avatar } = req.body;

  if (!email || !password || !name || !username) {
    context.res = {
      ...context.res,
      status: 400,
      body: { error: "Email, password, name, and username are all required" },
    };
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    context.res = {
      ...context.res,
      status: 400,
      body: { error: "Invalid email format" },
    };
    return;
  }

  // Password strength validation
  if (password.length < 6) {
    context.res = {
      ...context.res,
      status: 400,
      body: { error: "Password must be at least 6 characters long" },
    };
    return;
  }

  try {
    const database = client.database(databaseId);
    
    // Create container if it doesn't exist
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { path: "/id" }
    });

    // Check if user already exists (by email or username)
    const emailQuery = {
      query: "SELECT * FROM c WHERE c.email = @email",
      parameters: [{ name: "@email", value: email.toLowerCase() }],
    };

    const { resources: existingUsersByEmail } = await container.items.query(emailQuery).fetchAll();
    
    if (existingUsersByEmail.length > 0) {
      context.res = {
        ...context.res,
        status: 409,
        body: { error: "User with this email already exists" },
      };
      return;
    }

    // Username is required and must be unique
    if (username.length < 3) {
      context.res = {
        ...context.res,
        status: 400,
        body: { error: "Username must be at least 3 characters long" },
      };
      return;
    }

    const usernameQuery = {
      query: "SELECT * FROM c WHERE c.username = @username",
      parameters: [{ name: "@username", value: username.toLowerCase() }],
    };

    const { resources: existingUsersByUsername } = await container.items.query(usernameQuery).fetchAll();
    
    if (existingUsersByUsername.length > 0) {
      context.res = {
        ...context.res,
        status: 409,
        body: { error: "Username already taken" },
      };
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      moodStreak: 0,
      preferences: {
        theme: 'light',
        notifications: true,
        privacyMode: false
      }
    };

    await container.items.create(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userId, 
        email: email.toLowerCase(),
        name: name.trim()
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Return user info (without password) and token
    const { password: _, ...userWithoutPassword } = newUser;

    context.res = {
      ...context.res,
      status: 201,
      body: {
        message: "User registered successfully",
        user: userWithoutPassword,
        token: token
      },
    };
  } catch (error) {
    context.log("Registration error:", error.message);
    context.log("Stack trace:", error.stack);
    context.res = {
      ...context.res,
      status: 500,
      body: { error: "Internal server error during registration", details: error.message },
    };
  }
};

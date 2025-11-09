// =====================================
// BACKEND: js/index.js - MongoDB Atlas - CST3144
// =====================================
console.log("🚀 Starting Express + MongoDB Atlas server...");

// Use relative path to demo folder modules
var express = require("../demo/node_modules/express");
var http = require("http");
var path = require("path");
var mongodb = require("../demo/node_modules/mongodb");
var MongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;

// Express app
var app = express();
app.use(express.json());

// Static assets - CORRECTED PATHS
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/images', express.static(path.join(__dirname, '../assets/images')));

// Enable CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

// =====================================
// MongoDB Atlas Connection - CORRECTED WITH YOUR DETAILS
// =====================================
var connectionURI = "mongodb+srv://lessons:Clashofclans15@cluster1.5dpttrc.mongodb.net/backendlibrary?retryWrites=true&w=majority&appName=Cluster1";
var client = new MongoClient(connectionURI);
var db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("backendlibrary");
    console.log("✅ Connected to MongoDB Atlas Database: backendlibrary");

    // Check available collections
    var collections = await db.listCollections().toArray();
    console.log("📊 Available collections:", collections.map(function(c) { return c.name; }));

    // Auto-load sample lessons if 'lessons' collection is empty
    var lessonsCollection = db.collection("lessons");
    var lessonCount = await lessonsCollection.countDocuments();
    console.log("📚 Current lessons count:", lessonCount);
    
    if (lessonCount === 0) {
      console.log("➕ No lessons found. Adding sample data...");
      await addSampleLessons();
    }

    // Check if 'orders' collection exists
    var ordersExists = collections.some(function(c) { return c.name === "orders"; });
    if (!ordersExists) {
      await db.createCollection("orders");
      console.log("📦 Created 'orders' collection");
    } else {
      console.log("📦 'orders' collection already exists");
    }

    // Test orders collection
    var ordersCount = await db.collection("orders").countDocuments();
    console.log("🛒 Current orders count:", ordersCount);

  } catch (error) {
    console.error("❌ MongoDB Atlas connection error:", error);
  }
}

// Sample lessons if none exist
async function addSampleLessons() {
  try {
    var sampleLessons = [
      { id: 1001, subject: "Mathematics", location: "Hendon", price: 100, spaces: 5, image: "maths.png" },
      { id: 1002, subject: "Physics", location: "Colindale", price: 80, spaces: 5, image: "physic.png" },
      { id: 1003, subject: "Chemistry", location: "Brent Cross", price: 90, spaces: 5, image: "chemistry.png" },
      { id: 1004, subject: "Biology", location: "Golders Green", price: 95, spaces: 5, image: "biology.png" },
      { id: 1005, subject: "History", location: "Camden", price: 70, spaces: 5, image: "history.png" },
      { id: 1006, subject: "English", location: "Ealing", price: 85, spaces: 5, image: "english.png" },
      { id: 1007, subject: "Computer Science", location: "Watford", price: 120, spaces: 5, image: "compsci.png" },
      { id: 1008, subject: "Art", location: "Hackney", price: 60, spaces: 5, image: "artbook.png" },
      { id: 1009, subject: "Music", location: "Stratford", price: 110, spaces: 5, image: "music.png" },
      { id: 1010, subject: "Economics", location: "Islington", price: 130, spaces: 5, image: "economicsbook.png" }
    ];
    await db.collection("lessons").insertMany(sampleLessons);
    console.log("✅ Sample lessons added to MongoDB Atlas database");
  } catch (error) {
    console.error("❌ Error adding sample lessons:", error);
  }
}

// Connect to database
connectDB();

// =====================================
// Middleware - Logger
// =====================================
app.use(function (req, res, next) {
  console.log(new Date().toISOString() + " - " + req.method + " " + req.url);
  next();
});

// =====================================
// ROUTES (Keep all your existing routes exactly as they were)
// =====================================

// Get all lessons
app.get("/lessons", async function (req, res) {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not connected" });
    }
    var lessons = await db.collection("lessons").find({}).toArray();
    console.log("📤 Sent lessons:", lessons.length);
    res.json(lessons);
  } catch (error) {
    console.error("❌ Error fetching lessons:", error);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});

// Search lessons
app.get("/search", async function (req, res) {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not connected" });
    }
    
    var query = req.query.q;
    if (!query) return res.status(400).json({ error: "Query required" });

    console.log("🔍 Search query received:", query);

    var lessons = await db.collection("lessons").find({
      $or: [
        { subject: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { price: { $regex: query, $options: "i" } },
        { spaces: { $regex: query, $options: "i" } }
      ]
    }).toArray();

    console.log("🔍 Search results:", lessons.length);
    res.json(lessons);

  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// POST: Save new order to MongoDB Atlas
app.post("/orders", async function (req, res) {
  try {
    console.log(" ");
    console.log("=".repeat(50));
    console.log("🛒 ORDER SUBMISSION RECEIVED");
    console.log("=".repeat(50));
    
    if (!db) {
      console.error("❌ Database not connected");
      return res.status(500).json({ success: false, error: "Database not connected" });
    }

    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));

    var name = req.body.name;
    var phone = req.body.phone;
    var lessonIDs = req.body.lessonIDs;
    var totalPrice = req.body.totalPrice;
    var totalItems = req.body.totalItems;

    // Validation
    if (!name || !phone) {
      console.error("❌ Missing name or phone");
      return res.status(400).json({ success: false, error: "Name and phone are required" });
    }

    if (!lessonIDs || !Array.isArray(lessonIDs) || lessonIDs.length === 0) {
      console.error("❌ Invalid lesson IDs:", lessonIDs);
      return res.status(400).json({ success: false, error: "No valid lessons in cart" });
    }

    console.log("✅ Validation passed");
    console.log("📋 Order details:", {
      name: name,
      phone: phone,
      lessonIDs: lessonIDs,
      totalPrice: totalPrice,
      totalItems: totalItems
    });

    // Create order document
    var order = {
      name: name,
      phone: phone,
      lessonIDs: lessonIDs,
      totalPrice: totalPrice || 0,
      totalItems: totalItems || lessonIDs.length,
      orderDate: new Date(),
      status: "confirmed"
    };

    console.log("💾 Attempting to save order to MongoDB Atlas...");
    console.log("📄 Order document:", JSON.stringify(order, null, 2));

    // Save to MongoDB Atlas
    var result = await db.collection("orders").insertOne(order);
    
    console.log("✅ ORDER SAVED SUCCESSFULLY TO MONGODB ATLAS!");
    console.log("🗂️ MongoDB Insert Result:", result);
    console.log("🆔 Order ID:", result.insertedId);
    
    // Update lesson spaces in MongoDB Atlas
    console.log("🔄 Updating lesson spaces in database...");
    for (var i = 0; i < lessonIDs.length; i++) {
      var lessonId = lessonIDs[i];
      try {
        // Find lesson by numeric ID (since your frontend uses numeric IDs)
        var lesson = await db.collection("lessons").findOne({ id: lessonId });
        
        if (lesson) {
          // Update using the numeric ID
          await db.collection("lessons").updateOne(
            { id: lessonId },
            { $inc: { spaces: -1 } }
          );
          console.log("✅ Updated spaces for lesson:", lesson.subject);
        } else {
          console.warn("⚠️ Lesson not found with ID:", lessonId);
        }
      } catch (err) {
        console.warn("⚠️ Failed to update lesson:", lessonId, err);
      }
    }

    console.log("=".repeat(50));
    console.log(" ");

    // Return success response
    res.json({
      success: true,
      message: "Order saved to MongoDB Atlas successfully",
      orderId: result.insertedId,
      order: order
    });

  } catch (error) {
    console.error(" ");
    console.error("❌ ORDER SAVE ERROR:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error(" ");
    
    res.status(500).json({ 
      success: false, 
      error: "Failed to save order: " + error.message 
    });
  }
});

// GET: All orders (for debugging)
app.get("/orders", async function (req, res) {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not connected" });
    }
    
    var orders = await db.collection("orders").find({}).toArray();
    console.log("📥 Retrieved orders from database:", orders.length);
    
    res.json({ 
      success: true, 
      count: orders.length, 
      orders: orders 
    });
    
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// PUT: Update lesson spaces
app.put("/lessons/:id", async function (req, res) {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not connected" });
    }

    var lessonId = parseInt(req.params.id); // Parse as number for your numeric IDs
    var spaces = req.body.spaces;

    if (spaces === undefined) {
      return res.status(400).json({ error: "Spaces value required" });
    }

    var result = await db.collection("lessons").updateOne(
      { id: lessonId }, // Use numeric ID instead of ObjectId
      { $set: { spaces: spaces } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.json({ message: "Lesson updated", modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("❌ Update error:", error);
    res.status(500).json({ error: "Failed to update lesson" });
  }
});

// RESET: Reset all lesson spaces to 5 (ADD THIS NEW ROUTE)
app.put("/reset-lessons", async function (req, res) {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not connected" });
    }

    var result = await db.collection("lessons").updateMany(
      {}, 
      { $set: { spaces: 5 } }
    );

    console.log("🔄 Reset all lesson spaces to 5");
    res.json({ 
      success: true, 
      message: "All lesson spaces reset to 5",
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error("❌ Reset error:", error);
    res.status(500).json({ error: "Failed to reset lessons" });
  }
});

// Health check route
app.get("/health", function (req, res) {
  var dbStatus = db ? "Connected" : "Disconnected";
  res.json({
    status: "Server is running",
    database: "MongoDB Atlas - " + dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Test data route - to check if MongoDB Atlas is working
app.get("/test", async function (req, res) {
  try {
    if (!db) {
      return res.status(500).json({ error: "Database not connected" });
    }
    
    var lessonsCount = await db.collection("lessons").countDocuments();
    var ordersCount = await db.collection("orders").countDocuments();
    
    res.json({
      message: "✅ Backend is working correctly",
      database: "MongoDB Atlas - backendlibrary",
      lessonsCount: lessonsCount,
      ordersCount: ordersCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Database test failed: " + error.message });
  }
});

// Default route
app.get("/", function (req, res) {
  res.json({
    message: "📚 Express server running successfully",
    database: "MongoDB Atlas - backendlibrary",
    collections: ["lessons", "orders"],
    endpoints: {
      lessons: "GET /lessons",
      search: "GET /search?q=query",
      orders: "POST /orders",
      allOrders: "GET /orders",
      updateLesson: "PUT /lessons/:id",
      health: "GET /health",
      test: "GET /test"
    }
  });
});

// =====================================
// Start the server (KEEPING YOUR EXACT PORT SETUP)
// =====================================
var PORT = 3000;
http.createServer(app).listen(PORT, function () {
  console.log(" ");
  console.log("=".repeat(50));
  console.log("🚀 SERVER STARTED SUCCESSFULLY");
  console.log("=".repeat(50));
  console.log("📍 Server URL: http://localhost:" + PORT);
  console.log("🗄️ Database: MongoDB Atlas - backendlibrary");
  console.log("📂 Collections: lessons, orders");
  console.log(" ");
  console.log("🔗 Available Endpoints:");
  console.log("   GET  /lessons     - Get all lessons");
  console.log("   GET  /search?q=   - Search lessons");
  console.log("   POST /orders      - Submit new order");
  console.log("   GET  /orders      - View all orders");
  console.log("   PUT  /lessons/:id - Update lesson spaces");
  console.log("   PUT  /reset-lessons - Reset all spaces to 5");
  console.log("   GET  /health      - Server health check");
  console.log("   GET  /test        - Database test");
  console.log("=".repeat(50));
  console.log(" ");
});
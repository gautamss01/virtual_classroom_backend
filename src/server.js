const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");

const classroomRoutes = require("./routes/classroomRoutes");

const initSocketController = require("./controllers/socketController");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const uri = process.env.DB_HOST || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "virtual_classroom_dev";

mongoose
  .connect(uri, {
    dbName: dbName,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  })
  .then(() => console.log("------Connected to MongoDB------"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);

    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    async function pingDB() {
      try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log(
          "Pinged your deployment. You successfully connected to MongoDB!"
        );
      } catch (err) {
        console.error("Additional connection error details:", err);
      } finally {
        await client.close();
      }
    }

    pingDB().catch(console.dir);
  });

initSocketController(io);

app.use("/api/classroom", classroomRoutes);
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: 200, 
    message: "Virtual Classroom API is running",
    data: {
      version: "1.0.0",
      documentation: "/api-docs"
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

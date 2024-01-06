const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
//New imports

const cors = require("cors");
const httpServer = require("http").createServer(app); // Import and create an HTTP server
const { Server } = require("socket.io");
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Allow requests from this origin
    methods: ["GET", "POST"], // Specify the allowed HTTP methods
  },
});

const uri =
  "mongodb+srv://radiationcorporation2:Fy1hDtkCgGyLWvqV@cluster0.minbpqk.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
app.use(cors());
app.use(express.json());

async function run() {
  try {
    const videoCollection = client.db("GameDB").collection("videos");
    const likeCollection = client.db("GameDB").collection("liked");
    const orderCollection = client.db("GameDB").collection("order");
    const levelCollection = client.db("GameDB").collection("levels");
    const productCollection = client.db("GameDB").collection("products");
    const commentCollection = client.db("GameDB").collection("comment");
    const followCollection = client.db("GameDB").collection("followers");

    io.on("connection", (socket) => {
      // Listen for incoming messages from a client
      socket.on("message", async (data) => {
        try {
          // Save the message to MongoDB
          await messageCollection.insertOne({
            text: data.text,
            sender: data.sender,
          });

          // Emit the received message to all connected clients, including the sender
          io.emit("message", { text: data.text, sender: data.sender });
        } catch (error) {
          console.error("Error while processing message:", error);
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("A user disconnected");
      });
    });

    app.put("/addLike/:id", async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          // status: updateUser.status,
          like: updateUser.like,
        },
      };
      const result = await videoCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.post("/addFollow", async (req, res) => {
      const video = req.body;
      const result = await followCollection.insertOne(video);
      res.send(result);
    });

    app.put("/addFollow", async (req, res) => {
      try {
        const userEmail = req.body.email;
        const videoId = req.body.id;

        // Assuming videoCollection is a MongoDB collection instance
        const video = await videoCollection.findOne(
          { _id: new ObjectId(videoId) },
          { sort: { _id: 1 } } // Sort by _id in descending order (newest first)
        );

        if (video) {
          // Check if userEmail is not already in the followers array
          if (!video.followers.includes(userEmail)) {
            // Add userEmail to the followers array
            video.followers.push(userEmail);

            // Update the document in the collection
            await videoCollection.updateOne(
              { _id: new ObjectId(videoId) },
              { $set: { followers: video.followers } }
            );

            res.json({ success: true, message: "User added to followers" });
          } else {
            res.json({ success: false, message: "User is already a follower" });
          }
        } else {
          res.json({ success: false, message: "Video not found" });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    app.put("/addUnFollow", async (req, res) => {
      try {
        const userEmail = req.body.email;
        const videoId = req.body.id;

        // Assuming videoCollection is a MongoDB collection instance
        const video = await videoCollection.findOne({
          _id: new ObjectId(videoId),
        });

        if (video) {
          // Check if userEmail is in the followers array
          const indexOfUser = video.followers.indexOf(userEmail);

          if (indexOfUser !== -1) {
            // Remove userEmail from the followers array
            video.followers.splice(indexOfUser, 1);

            // Update the document in the collection
            await videoCollection.updateOne(
              { _id: new ObjectId(videoId) },
              { $set: { followers: video.followers } }
            );

            res.json({ success: true, message: "User removed from followers" });
          } else {
            res.json({ success: false, message: "User is not a follower" });
          }
        } else {
          res.json({ success: false, message: "Video not found" });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    app.post("/saveLikedVideos", async (req, res) => {
      const video = req.body;
      const result = await likeCollection.insertOne(video);
      res.send(result);
    });

    app.get("/api/fetchLikedVideos/:userEmail", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = likeCollection.find(query);
      const ticket = await cursor.toArray();
      res.send(ticket);
    });

    // find details with id information
    app.get("/ticket/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await ticketCollection.findOne(query);
      console.log(result);
      res.send(result);
    });

    app.get("/videos", async (req, res) => {
      const query = {};
      const cursor = videoCollection.find(query);
      const video = await cursor.toArray();
      res.send(video);
    });
    app.get("/comments", async (req, res) => {
      const query = {};
      const cursor = commentCollection.find(query);
      const video = await cursor.toArray();
      res.send(video);
    });
    // post for add confirm ticket
    app.post("/addVideo", async (req, res) => {
      const video = req.body;
      const result = await videoCollection.insertOne(video);
      res.send(result);
    });
    app.post("/addLevel", async (req, res) => {
      const video = req.body;
      const result = await levelCollection.insertOne(video);
      res.send(result);
    });
    app.post("/addProduct", async (req, res) => {
      const video = req.body;
      const result = await productCollection.insertOne(video);
      res.send(result);
    });
    app.post("/addComment", async (req, res) => {
      const video = req.body;
      const result = await commentCollection.insertOne(video);
      res.send(result);
    });

    // post for add confirm ticket
    app.post("/addOrder", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.get("/myVideos", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = videoCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });
    app.get("/myFollow", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = followCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.post("/addClaim", async (req, res) => {
      const claims = req.body;

      const result = await claimCollection.insertOne(claims);

      res.send(result);
    });

    app.post("/addMessage", async (req, res) => {
      const review = req.body;
      const result = await messageCollection.insertOne(review);

      res.send(result);
    });

    app.get("/validateUserRole", async (req, res) => {
      const userEmail = req.query.email;

      try {
        // Find the user by email in your MongoDB user collection
        const user = await userCollection.findOne({ email: userEmail });

        if (user) {
          res.json({ userRole: user.userRole });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    });
    app.get("/validateAdminRole", async (req, res) => {
      const userEmail = req.query.email;

      try {
        // Find the user by email in your MongoDB user collection
        const user = await adminCollection.findOne({ email: userEmail });

        if (user) {
          res.json({ userRole: user.userRole });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    });

    // find ticket email query
    app.get("/myTicket", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = ticketCollection.find(query);
      const ticket = await cursor.toArray();
      res.send(ticket);
    });
    // find trip email query
    app.get("/myTrip", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const cursor = driverCollection.find(query);
      const ticket = await cursor.toArray();
      res.send(ticket);
    });
    // find ticket bus query
    app.get("/busTicket", async (req, res) => {
      const busNo = parseInt(req.query.busNo);

      const query = { busNo: busNo };
      const cursor = ticketCollection.find(query);
      const ticket = await cursor.toArray();
      res.send(ticket);
    });

    // get method for users with role query
    app.get("/drivers", async (req, res) => {
      const role = req.query.role;
      const query = { role: role };
      const users = await userCollection.find(query).toArray();
      res.send(users);
    });
    // post for users method
    app.post("/drivers", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // post for wallet users method
    app.post("/addUsers", async (req, res) => {
      const user = req.body;
      const result = await walletCollection.insertOne(user);
      res.send(result);
    });
    app.post("/admin", async (req, res) => {
      const user = req.body;
      const result = await adminCollection.insertOne(user);
      res.send(result);
    });

    app.put("/claim/:id", async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: updateUser.status,
        },
      };
      const result = await claimCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.put("/myticket/:id", async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: updateUser.status,
          secret: updateUser.secret,
        },
      };
      const result = await ticketCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    app.put("/adminApprove/:id", async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: updateUser.status,
        },
      };
      const result = await managerCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.put("/incrementView", async (req, res) => {
      const { videoId, email } = req.body;
      console.log(email);
      console.log(videoId);

      try {
        // Check if the video with the specified _id and user email exists
        const video = await videoCollection.findOne({
          _id: new ObjectId(videoId),
          // email: email,
        });

        if (!video) {
          return res.status(404).json({
            error: "Video not found or user does not have permission",
          });
        }

        // Increment the views count for the video
        const result = await videoCollection.updateOne(
          { _id: new ObjectId(videoId) },
          { $inc: { views: 1 } }
        );

        if (result.modifiedCount === 0) {
          return res
            .status(500)
            .json({ error: "Failed to update views count" });
        }

        res.json({
          success: true,
          message: "View count incremented successfully",
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.put("/addComment", async (req, res) => {
      const { comment, videoId } = req.body;
      console.log(comment, videoId);

      try {
        // Update the comment count for the video with the specified _id
        const result = await videoCollection.updateOne(
          { _id: new ObjectId(videoId) },
          { $inc: { comment: 1 } } // Increment the comments field by 1
        );

        console.log(result);

        if (result.modifiedCount === 0) {
          return res.status(404).json({ error: "Video not found" });
        }

        res.json({ success: true, message: "Comment added successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Game app is running");
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require('cors')
require('dotenv').config()
const app = express()
app.use(cors());
app.use(express.json())
const port = process.env.PORT || 3000

const client = new MongoClient(process.env.uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("SwiftShop")
    const userCollection = database.collection("Users")


    const VerifyToken = async (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access!" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "Unauthorized Access!" });
      }

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Invalid or expired token" });
        }

        req.user = decoded;
        // console.log(decoded)
        next();
      });
    };


    app.post("/user", async (req, res) => {
      const data = req.body
      const email = req.body.email;
      console.log(email)


      const quary = await userCollection.findOne({ email })
      if (quary) {
        res.send({ message: "user already redister" })
      }
      else {
        try {
          const result = await userCollection.insertOne(data);
          res.status(201).send(result);
        } catch (error) {
          res.status(500).send({ error: error.message });
        }
      }

    });
    app.get("/user", async (req, res) => {
      const { email } = req.query;
      try {
        const result = await userCollection.findOne({ email });
        res.send(result)
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    })

    app.get("/login", async (req, res) => {

      try {
        const { email, password } = req.query;
        // console.log(email, password)

        const user = await userCollection.findOne({ email, password });
        const token = jwt.sign(
          { "email": email },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1h" }
        );

        if (!user) {
          return res.status(401).send({ message: "Invalid credentials" });
        }

        res.send({ message: "Login successful", user, token });
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    app.get("/user/profile", VerifyToken, async (req, res) => {
      try {
        const email = req.user.email; // ✅ decoded থেকে email নিন
        console.log("email Check:", email);

        const user = await userCollection.findOne({ email });
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }

        res.send(user);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    app.get("/all-user", VerifyToken, async (req, res) => {
      // console.log(req.user.email)
      const reault = await userCollection.find().toArray();
      res.send(reault)

    })

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('S w i f t S h o p')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

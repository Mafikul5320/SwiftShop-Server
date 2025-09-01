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


    app.post("/user", async (req, res) => {
      const data = req.body
      try {
        const result = await userCollection.insertOne(data);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    app.get("/login", async (req, res) => {
      try {
        const { email, password } = req.query;
        console.log(email, password)

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

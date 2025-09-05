const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const CategoriesCollection = database.collection("Categories")
    const ProductsCollection = database.collection("Products")


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
          { expiresIn: 15 }
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
        const email = req.user.email;
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

    app.get("/categories", async (req, res) => {
      const reault = await CategoriesCollection.find().toArray();
      res.send(reault)

    })
    app.post("/product", async (req, res) => {
      const data = req.body;
      try {
        const product = await ProductsCollection.insertOne(data);
        res.status(201).json({ message: "Product added successfully", product });
      } catch (error) {
        res.status(500).json({ message: "Server error" });
      }
    })

    app.get("/product", async (req, res) => {
      try {
        const { category } = req.query;
        let query = {};
        if (category) {
          query.categories = category;
        }

        const result = await ProductsCollection
          .find(query)
          .sort({ _id: -1 })
          .toArray();

        res.status(200).send(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    app.get("/product-details/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id)
      try {
        const result = await ProductsCollection.findOne({ _id: new ObjectId(id) })
        res.send(result)
      } catch (error) {
        res.status(500).json({ message: "Server error" })
      }
    })

    app.get("/users", async (req, res) => {
      try {
        const result = await userCollection.find().toArray();
        res.status(200).send(result);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Failed to get users");
      }
    });


    app.get("/oneproduct", async (req, res) => {
      const { id } = req.query;
      if (!id) {
        return res.status(400).send({ message: "Product ID is required" });
      }
      try {
        const result = await ProductsCollection.findOne({ _id: new ObjectId(id) });

        if (!result) {
          return res.status(404).send({ message: "Product not found" });
        }
        res.send(result);
      } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).send({ message: "Failed to get product" });
      }
    });

    app.put("/updateproduct/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id)
        const updatedData = req.body;
        console.log(updatedData)
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            product_name: updatedData.product_name,
            slug: updatedData.slug,
            price: updatedData.price,
            discount: updatedData.discount,
            stockStatus: updatedData.stockStatus,
            categories: updatedData.categories,
            description: updatedData.description,
            status: updatedData.status,
            product_img: updatedData.product_img,
            updatedAt: new Date(),
          },
        };

        const result = await ProductsCollection.updateOne(filter, updateDoc);
        res.status(200).json({ result, message: "Product updated successfully" });
      } catch (err) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
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

import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import checkauth from "../checkauth.mjs";

const router = express.Router();

// Get all the records (public - no auth needed)
router.get("/", async (req, res) => {
    let collection = await db.collection("posts");
    let results = await collection.find({}).toArray();
    res.send(results).status(200);
});

// Create a new record (protected - requires auth)
router.post("/upload", checkauth, async (req, res) => {
    let newDocument = {
        user: req.body.user,
        content: req.body.content,
        image: req.body.image
    };
    let collection = await db.collection("posts");
    let result = await collection.insertOne(newDocument);
    res.send(result).status(204);
});

// Update a record by id (protected - requires auth)
router.patch("/:id", checkauth, async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    const updates = {
        $set: {
            user: req.body.user,
            content: req.body.content,
            image: req.body.image
        }
    };

    let collection = await db.collection("posts");
    let result = await collection.updateOne(query, updates);
    res.send(result).status(200);
});

// Gets a single record by id (public)
router.get("/:id", async (req, res) => {
    let collection = await db.collection("posts");
    let query = {_id: new ObjectId(req.params.id)};
    let result = await collection.findOne(query);

    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

// Delete a record (protected - requires auth)
router.delete("/:id", checkauth, async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    const collection = db.collection("posts");
    let result = await collection.deleteOne(query);
    res.send(result).status(200);
});

// Make sure this line is exactly like this:
export default router;
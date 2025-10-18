import mongoose from "mongoose";
import Client from "../src/models/Client.js";    // Your Client model
import projectTypes from "../src/models/ProjectType.js"; // Your ProjectType model

await mongoose.connect("mongodb+srv://root:root123@tracker.vnkyhhp.mongodb.net/tracker?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const clientId = "68f124dbec5605b8d8266444";

const client = await Client.findById(clientId)
  .populate({
    path: "projectTypes",       // name of the field in Client schema
    // select: "name description", // optional, "*" for all fields
    strictPopulate: false       // override strictPopulate check
  })
  .exec();

console.log(client);

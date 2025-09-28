// routes/populateRouter.js
import express from "express";
import { authMiddleware } from "../middlewares/autmiddleware.js";
import { populateHelper } from "../helper/populateHelper.js";

const router = express.Router();
console.log("populateRoutes initialized");

// without id
router.all("/:action/:model", authMiddleware, populateHelper);

// with id
router.all("/:action/:model/:id", authMiddleware, populateHelper);

export default router;

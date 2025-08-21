// routes/populateRouter.js
import express from "express";
import { authMiddleware } from "../middlewares/autmiddleware.js";
import { handlePopulate } from "../helper/populateHelper.js";

const router = express.Router();

// without id
router.all("/:action/:model", authMiddleware, handlePopulate);

// with id
router.all("/:action/:model/:id", authMiddleware, handlePopulate);

export default router;

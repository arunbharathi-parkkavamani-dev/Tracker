// routes/populateRouter.js
import express from "express";
import { authMiddleware } from "./middlewares/authMiddleware.js"
import { handlePopulate } from "../helpers/populateHelper.js";

const router = express.Router();

router.all("/:action/:model/:id?", authMiddleware, handlePopulate);

export default router;
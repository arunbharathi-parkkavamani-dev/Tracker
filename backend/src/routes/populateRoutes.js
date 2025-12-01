// routes/populateRouter.js
import express from "express";
import { authMiddleware } from "../middlewares/autmiddleware.js";
import { populateHelper } from "../helper/populateHelper.js";
import { upload } from "../middlewares/multerConfig.js";

const router = express.Router();

// without id
router.all("/:action/:model", authMiddleware, upload.single('file'), populateHelper);

// with id  
router.all("/:action/:model/:id", authMiddleware, upload.single('file'), populateHelper);

export default router;

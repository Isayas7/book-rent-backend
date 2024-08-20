import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    ownerStatus,
    getOwners,
    deleteOwner
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/owner-list", verifyToken, getOwners);
router.put("/status/:id", verifyToken, ownerStatus);
router.delete("/:id", verifyToken, deleteOwner);



export default router;

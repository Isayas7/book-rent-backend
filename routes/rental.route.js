import express from "express";
import { rentBook, returnBook, ownRental, rentalStatics } from "../controllers/rent.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/rent/:id", verifyToken, rentBook);
router.put("/return/:id", verifyToken, returnBook);
router.get("/own-rental", verifyToken, ownRental);
router.get("/rental-statics", verifyToken, rentalStatics);


export default router;

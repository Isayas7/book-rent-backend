import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  addBook,
  updateBook,
  deleteBook,
  getOwnSingleBook,
  getOwnBooks,
  allFreeBooksForOwner,
  getBooks,
  getAllBooks,
  changeBookStatus,
  allFreeBooks,
} from "../controllers/book.controller.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.post("/create", verifyToken, upload.single('cover'), addBook);
router.put("/:id", verifyToken, upload.single('cover'), updateBook);
router.delete("/:id", verifyToken, deleteBook);
router.get("/single/:id", verifyToken, getOwnSingleBook);
router.get("/own-books", verifyToken, getOwnBooks);
router.get("/free-owner-books", verifyToken, allFreeBooksForOwner);

router.get("/", verifyToken, getBooks);

router.get("/all-books", verifyToken, getAllBooks);
router.put("/status/:id", verifyToken, changeBookStatus);
router.get("/free-books", verifyToken, allFreeBooks);




export default router;

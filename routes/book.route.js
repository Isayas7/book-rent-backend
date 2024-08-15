import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  addBook,
  changeBookStatus,
  deleteBook,
  getBooks,
  getAllBooks,
  getOwnBooks,
  updateBook,
  allFreeBooks,
  allFreeBooksForOwner,
  getOwnSingleBook
} from "../controllers/book.controller.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.post("/create", verifyToken, upload.single('cover'), addBook);
router.put("/:id", verifyToken, upload.single('cover'), updateBook);
router.delete("/:id", verifyToken, deleteBook);
router.get("/", verifyToken, getBooks);
router.get("/ownBooks", verifyToken, getOwnBooks);
router.get("/allBooks", verifyToken, getAllBooks);

router.put("/status/:id", verifyToken, changeBookStatus);
router.get("/free-books", verifyToken, allFreeBooks);
router.get("/free-owner-books", verifyToken, allFreeBooksForOwner);




export default router;

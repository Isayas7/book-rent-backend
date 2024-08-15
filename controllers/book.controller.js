import prisma from "../utils/connect.js";
import { createBookSchema, updateBookSchema } from "../utils/validationSchema.js";
import { z } from "zod";
import defineAbilityFor from "../utils/abilities.js";
import { subject } from "@casl/ability";
import { UserStatus, BookStatus } from "@prisma/client";
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';


export const addBook = async (req, res) => {
  const currentUser = req.user;
  const ability = defineAbilityFor(currentUser);
  const isAllowed = ability.can("upload", "Book")

  if (!isAllowed) {
    return res.status(403).json({ message: "Forbidden: You do not have permission to upload books." });
  }

  try {
    const { bookName, author, category, quantity, rentPrice } = req.body;

    const dataForValidation = { bookName, author, category, quantity: parseInt(quantity), rentPrice: parseFloat(rentPrice) }
    const validatedData = createBookSchema.parse(dataForValidation);


    let coverUrl = null;


    const book = await prisma.book.findUnique({
      where: { bookName },
    });

    if (book) {
      return res.status(403).json({ message: "The Book alredy exist." });
    }

    // Upload cover image to Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder: 'books' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        // Create a readable stream from the buffer
        const bufferStream = streamifier.createReadStream(req.file.buffer);
        bufferStream.pipe(uploadStream);
      });
      coverUrl = result.secure_url;
    }

    // Save 
    const newBook = await prisma.book.create({
      data: {
        bookName,
        ownerId: currentUser.id,
        author: author,
        category: category,
        quantity: parseInt(quantity, 10),
        rentPrice: parseFloat(rentPrice),
        coverPhotoUrl: coverUrl,
      },
    });

    res.status(201).json(newBook);
  } catch (error) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data" });
    }
    res.status(500).json({ error: 'An error occurred while uploading the book' });
  }
};




export const updateBook = async (req, res) => {
  const id = parseInt(req.params.id)
  const currentUser = req.user

  try {

    const { bookName, author, category, quantity, rentPrice } = req.body;

    const dataForValidation = { bookName, author, category, quantity: parseInt(quantity), rentPrice: parseFloat(rentPrice) }
    const validatedData = updateBookSchema.parse(dataForValidation);


    let coverUrl = null;

    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const ability = defineAbilityFor(currentUser);
    const isAllowed = ability.can('update', subject('Book', book));

    if (!isAllowed) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to update this book." });
    }

    // Upload cover image to Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder: 'books' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        // Create a readable stream from the buffer
        const bufferStream = streamifier.createReadStream(req.file.buffer);
        bufferStream.pipe(uploadStream);
      });
      coverUrl = result.secure_url;
    }

    if (coverUrl) {
      validatedData.coverPhotoUrl = coverUrl
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: validatedData,
    });
    res.status(201).json({ message: "Book updated successfully" });

  } catch (err) {
    console.log("err", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    res.status(500).json({ message: "Failed to update books" });
  }

};

export const deleteBook = async (req, res) => {
  const id = parseInt(req.params.id)
  const currentUser = req.user;

  try {
    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const ability = defineAbilityFor(currentUser);
    const isAllowed = ability.can('delete', subject('Book', book));

    if (!isAllowed) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to delete this book." });
    }


    await prisma.book.delete({
      where: { id },
    });

    res.status(200).json({ message: "Book deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete book" });
  }
};


export const getOwnSingleBook = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const currentUser = req.user;

  try {
    const ability = defineAbilityFor(currentUser);
    const isAllowed = ability.can('get', 'ownSingleBook');

    if (!isAllowed) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource.' });
    }

    const ownSingleBook = await prisma.book.findUnique({
      where: { id, ownerId: currentUser.id },
    });

    if (!ownSingleBook) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    res.status(200).json({ data: ownSingleBook });
  } catch (err) {
    console.error('Error fetching single book:', err); // Better logging
    res.status(500).json({ message: 'Failed to get the book.' });
  }
};


export const getOwnBooks = async (req, res) => {
  const currentUser = req.user;
  const ability = defineAbilityFor(currentUser);
  const isAllowed = ability.can('get', "OwnBooks");


  if (!isAllowed) {
    return res.status(403).json({ message: "Forbidden: You do not have permission to get this book." });
  }

  const {
    id,
    bookName,
    category,
    author,
    quantity,
    rentPrice,
    globalFilter
  } = req.query;


  try {
    // Build the filter criteria for the Book table
    let bookFilter = {};
    if (id) bookFilter.id = parseInt(id);
    if (bookName) bookFilter.bookName = bookName;
    if (category) bookFilter.category = category;
    if (author) bookFilter.author = author;
    if (quantity) bookFilter.quantity = quantity;
    if (rentPrice) bookFilter.rentPrice = parseFloat(rentPrice);



    const options = {
      where: {
        ownerId: currentUser.id,
        ...bookFilter,
        ...(globalFilter ? {
          OR: [
            { bookName: { contains: globalFilter, mode: 'insensitive' } },
            { author: { contains: globalFilter, mode: 'insensitive' } },
            { category: { contains: globalFilter, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: {
        rentals: {
          select: {
            status: true,
            rentPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    };

    // Execute the query
    const books = await prisma.book.findMany(options);


    const booksWithDetails = books.map(book => {
      const rentalInfo = book.rentals.length > 0 ? book.rentals[0] : { status: 'Free', rentPrice: 0 };

      return {
        ...book,
        rentalStatus: rentalInfo.status,
        rentPrice: rentalInfo.rentPrice
      };
    });

    res.status(200).json({ data: booksWithDetails });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get books" });
  }
};



export const getAllBooks = async (req, res) => {

  const currentUser = req.user;
  const ability = defineAbilityFor(currentUser);
  const isAllowed = ability.can("get", "AllBooks");

  if (!isAllowed) {
    return res.status(403).json({ message: "Forbidden: You do not have permission to get all book." });
  }

  const {
    id,
    bookName,
    category,
    author,
    username,
    location,
    globalFilter
  } = req.query;


  try {

    let bookFilter = {};

    if (id) bookFilter.id = parseInt(id);
    if (bookName) bookFilter.bookName = bookName;
    if (author) bookFilter.author = author;
    if (category) bookFilter.category = category;

    // Build the filter criteria for the Owner table
    let ownerFilter = {};
    if (username) ownerFilter.username = { contains: username, mode: 'insensitive' };
    if (location) ownerFilter.location = { contains: location, mode: 'insensitive' };

    // Construct the Prisma query options with conditional `where` clause
    const options = {
      where: {
        ...bookFilter,
        ...(globalFilter ? {
          OR: [
            { bookName: { contains: globalFilter, mode: 'insensitive' } },
            { author: { contains: globalFilter, mode: 'insensitive' } },
            { category: { contains: globalFilter, mode: 'insensitive' } },
            {
              owner: {
                OR: [
                  { username: { contains: globalFilter, mode: 'insensitive' } },
                  { location: { contains: globalFilter, mode: 'insensitive' } },
                ],
              },
            },
          ],
        } : {}),
        ...(Object.keys(ownerFilter).length > 0 ? {
          owner: {
            AND: [
              ...(ownerFilter.username ? [{ username: ownerFilter.username }] : []),
              ...(ownerFilter.location ? [{ location: ownerFilter.location }] : []),
            ],
          },
        } : {}),
      },
      include: {
        owner: {
          select: {
            username: true,
            location: true,
          },
        },
        rentals: {
          select: {
            status: true,
            rentPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    };

    // Execute the query
    const books = await prisma.book.findMany(options);

    const booksWithDetails = books.map(book => {
      const rentalInfo = book.rentals.length > 0 ? book.rentals[0] : { status: 'Free', rentPrice: 0 };

      return {
        ...book,
        username: book.owner.username,
        rentalStatus: rentalInfo.status,
        rentPrice: rentalInfo.rentPrice
      };
    });

    res.status(200).json({ data: booksWithDetails });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get Book list" });
  }
};



export const getBooks = async (req, res) => {

  try {
    const filters = {};
    let userIds;

    // First find user those their status  APPROVED
    const users = await prisma.user.findMany({
      where: {
        status: UserStatus.APPROVED
      },
    });

    userIds = users.map(user => user.id);


    if (userIds) {
      filters.ownerId = { in: userIds };
    }

    const booksList = await prisma.book.findMany({
      where: {
        status: BookStatus.APPROVED,
        isAvailable: true,
        ...filters
      },
    });

    res.status(200).json(booksList);
  } catch (err) {
    console.log(err);


    res.status(500).json({ message: "Failed to get Book list" });
  }
};



export const changeBookStatus = async (req, res) => {
  const currentUser = req.user

  const id = parseInt(req.params.id)
  const { status } = req.body

  const ability = defineAbilityFor(currentUser);
  const isAllowed = ability.can("change", "bookStatus")

  if (!isAllowed) {
    return res.status(403).json({ message: "Forbidden: You do not have permission to change book status." });
  }

  try {
    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      return res.status(404).json({ message: "book not found" });
    }

    const bookStatus = await prisma.book.update({
      where: { id },
      data: { status },
    });

    res.status(201).json({ message: `{Book is ${status} successfully}` });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data", errors: err.errors });
    }
    res.status(500).json({ message: "Failed to change book status" });
  }

}


export const allFreeBooks = async (req, res) => {

  const currentUser = req.user

  if (!currentUser) {
    return res.status(400).json({ error: 'Owner ID is required' });
  }

  const ability = defineAbilityFor(currentUser);
  const isAllowed = ability.can('get', "allFreeBooks");

  if (!isAllowed) {
    return res.status(403).json({ message: "Forbidden: You do not have permission to get the data." });
  }
  try {
    const availableBooks = await prisma.book.findMany({
      where: {
        isAvailable: true,
        rentals: {
          none: {
            returnDate: {
              gte: new Date(),
            }
          }
        }
      },
      select: {
        category: true
      }
    });

    // Group by category and count books
    const categoryCounts = availableBooks.reduce((acc, book) => {
      acc[book.category] = (acc[book.category] || 0) + 1;
      return acc;
    }, {});

    res.json(categoryCounts);
  } catch (error) {
    console.error('Error fetching free books:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const allFreeBooksForOwner = async (req, res) => {
  const currentUser = req.user

  if (!currentUser) {
    return res.status(400).json({ error: 'Owner ID is required' });
  }

  const ability = defineAbilityFor(currentUser);
  const isAllowed = ability.can('get', "ownFreeBooks");

  if (!isAllowed) {
    return res.status(403).json({ message: "Forbidden: You do not have permission to get the data." });
  }

  try {
    // Fetch available books for the specified owner
    const availableBooks = await prisma.book.findMany({
      where: {
        isAvailable: true,
        ownerId: Number(currentUser.id),
        rentals: {
          none: {
            returnDate: {
              gte: new Date(),
            }
          }
        }
      },
      select: {
        category: true
      }
    });

    // Group by category and count books
    const categoryCounts = availableBooks.reduce((acc, book) => {
      acc[book.category] = (acc[book.category] || 0) + 1;
      return acc;
    }, {});

    res.json(categoryCounts);
  } catch (error) {
    console.error('Error fetching free books for owner:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


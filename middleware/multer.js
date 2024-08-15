// src/middleware/multer.ts
import multer from 'multer';

// Configure Multer to store files temporarily
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });

export default upload;

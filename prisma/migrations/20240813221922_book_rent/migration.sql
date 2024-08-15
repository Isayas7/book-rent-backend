-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OWNER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('APPROVE', 'APPROVED');

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('APPROVE', 'APPROVED');

-- CreateEnum
CREATE TYPE "RentStatus" AS ENUM ('BORROWED', 'RETURNED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "phoneNumber" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "location" TEXT NOT NULL,
    "wallet" DOUBLE PRECISION DEFAULT 0.00,
    "status" "UserStatus" NOT NULL DEFAULT 'APPROVE',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookName" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "rentPrice" DOUBLE PRECISION NOT NULL,
    "coverPhotoUrl" TEXT,
    "status" "BookStatus" NOT NULL DEFAULT 'APPROVE',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" SERIAL NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RentStatus" NOT NULL DEFAULT 'BORROWED',
    "quantity" INTEGER NOT NULL,
    "rentPrice" DOUBLE PRECISION NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "bookId" INTEGER NOT NULL,
    "renterId" INTEGER NOT NULL,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Book_bookName_key" ON "Book"("bookName");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

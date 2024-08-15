import prisma from "../utils/connect.js";
import { z } from "zod";
import defineAbilityFor from "../utils/abilities.js";
import { UserRole } from "@prisma/client";

export const getOwners = async (req, res) => {
    const currentUser = req.user;


    try {
        const ability = defineAbilityFor(currentUser);
        const isAllowed = ability.can('get', "Owners");


        if (!isAllowed) {
            return res.status(403).json({ message: "Forbidden: You do not have permission to get Owners list." });
        }

        const ownersList = await prisma.user.findMany({
            where: {
                role: UserRole.OWNER
            },
            include: {
                _count: {
                    select: { books: true }
                }
            }
        });


        const ownersWithBookCount = ownersList.map(owner => ({
            ...owner,
            upload: owner._count.books
        }));

        res.status(200).json({ data: ownersWithBookCount });
    } catch (err) {
        res.status(500).json({ message: "Failed to get users" });
    }
};

export const ownerStatus = async (req, res) => {
    const currentUser = req.user

    const id = parseInt(req.params.id)
    const { status } = req.body

    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const ability = defineAbilityFor(currentUser);
        const isAllowed = ability.can("change", "OwnerStatus")

        if (!isAllowed) {
            return res.status(403).json({ message: "Forbidden: You do not have permission to change owners status." });
        }

        const ownerStatus = await prisma.user.update({
            where: { id },
            data: { status },
        });

        res.status(201).json({ message: `{User is ${status} successfully}` });

    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid request data", errors: err.errors });
        }
        res.status(500).json({ message: "Failed to update users" });
    }

}

export const deleteOwner = async (req, res) => {
    const id = parseInt(req.params.id);
    const currentUser = req.user;
    const ability = defineAbilityFor(currentUser);
    const isAllowed = ability.can('delete', "Owner");

    if (!isAllowed) {
        return res.status(403).json({ message: "Forbidden: You do not have permission to delete this owner." });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return res.status(404).json({ message: "Owner not found" });
        }

        // Optional: Delete related books
        await prisma.book.deleteMany({
            where: { ownerId: id },
        });

        await prisma.user.delete({
            where: { id },
        });

        res.status(200).json({ message: "Owner deleted" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Failed to delete owner" });
    }
};

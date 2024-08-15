
import { defineAbility } from '@casl/ability';
import { UserRole } from '@prisma/client';

export default function defineAbilityFor(user) {
  return defineAbility((can) => {
    can("return", "Book", { renterId: user.id });
    if (user.role === UserRole.ADMIN) {
      can("get", "Owners");
      can("change", "OwnerStatus");
      can("get", "AllBooks");
      can("change", "bookStatus");
      can('get', "revenue")
      can('get', "allFreeBooks")
      can('delete', "Owner")

    } else if (user.role === UserRole.OWNER) {
      can("upload", "Book");
      can("update", "Book", { ownerId: user.id });
      can("delete", "Book", { ownerId: user.id });
      can("get", "OwnBooks");
      can('get', "ownRevenue");
      can('get', "ownFreeBooks")
      can('get', "ownSingleBook");
    }
  });
}
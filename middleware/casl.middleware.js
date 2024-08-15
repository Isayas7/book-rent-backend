import { defineAbilityFor } from "../config/abilities";

export function authorize(action, subject) {
  return (req, res, next) => {
    const ability = defineAbilityFor(req.user);

    if (ability.can(action, subject)) {
      return next();
    } else {
      return res.status(403).json({ message: "Unauthorized, access Denied" });
    }
  };
}

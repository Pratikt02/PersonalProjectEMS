export const allowRoles = (...roles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role?.toLowerCase();

      if (!userRole) {
        return res.status(401).json({ message: "Unauthorized: role missing" });
      }

      const allowed = roles.map((r) => r.toLowerCase());

      if (!allowed.includes(userRole)) {
        return res.status(403).json({
          message: `Access denied: ${userRole} cannot access this route`,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ message: "Role check failed" });
    }
  };
};

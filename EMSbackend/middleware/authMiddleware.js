import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🔐 Verify Token
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Find user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ FIX: Always set in same format for whole project
    req.user = user;
    req.userId = user._id.toString();  // ✅ best for controllers

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

// 🔐 Role Authorization
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to access this resource" });
    }
    next();
  };
};

export default protect;

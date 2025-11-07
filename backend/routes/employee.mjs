import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db/conn.mjs";
import { body, validationResult } from "express-validator";

const router = express.Router();

// ✅ Strong RegEx patterns for whitelisting input
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

// ✅ POST: Employee Login (No Registration)
router.post(
  "/login",
  [
    body("username").matches(usernameRegex).withMessage("Invalid username format"),
    body("password").matches(passwordRegex).withMessage("Invalid password format"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;
      const employees = db.collection("employees");

      const employee = await employees.findOne({ username });
      if (!employee) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!employee.isActive) {
        return res.status(403).json({ message: "Account deactivated" });
      }

      const passwordMatch = await bcrypt.compare(password, employee.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // ✅ Generate secure JWT
      const token = jwt.sign(
        {
          userId: employee._id,
          username: employee.username,
          role: employee.role,
        },
        process.env.JWT_SECRET || "secure_employee_portal_key",
        { expiresIn: "2h" }
      );

      res.status(200).json({
        message: "Login successful",
        token,
        employee: {
          id: employee._id,
          username: employee.username,
          fullName: employee.fullName,
          role: employee.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;

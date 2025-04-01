import express from "express";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";

const router = express.Router();

router.post(
  "/createUser",
  asyncHandler(async (req, res) => {
    const {
      name,
      email,
      password,
      address,
      state,
      city,
      pinCode,
      userRecentOrder,
      keepShoppingFor,
      userCart,
    } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error("User already exists");
    }

    const user = await User.create({
      name,
      email,
      address,
      state,
      city,
      pinCode,
      userRecentOrder,
      keepShoppingFor,
      userCart,
      password,
    });

    if (user) {
      res.status(201).json({
        user: user,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  })
);

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        user: user,
        token: generateToken(user._id),
        message: "Login Successful",
      });
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  })
);

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Public
router.post("/logout", (req, res) => {
  res.json({ message: "User logged out" });
});

export default router;

import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../utils/token.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return sendError(res, 400, "Username, Email and Password are required!");
    }

    const findExist = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (findExist) {
      return sendError(res, 400, "User already exists!");
    }

    const newUser = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      slug: `${username
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")}-${Date.now().toString(36)}`,
    });

    await newUser.save();

    const token = signToken(newUser._id);

    sendSuccess(res, { status: 201, message: "Registered successfully!", data: { token } });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, "Email and Password are required!");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return sendError(res, 400, "User not found!");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, 400, "Invalid credentials!");
    }

    const token = signToken(user._id);

    sendSuccess(res, { message: "Logged in successfully!", data: { token } });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

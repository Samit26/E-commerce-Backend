import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  pinCode: { type: Number, required: true },
  userRecentOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  keepShoppingFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  userCart: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;

import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: [String], required: true },
  brand: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  images: { type: [String] }, // Array of image URLs
  sales: { type: Number, default: 0 }, // Number of times purchased
  views: { type: Number, default: 0 }, // Number of times viewed
  rating: {
    average: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    reviews: [
      {
        // user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        user: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String },
      },
    ],
  },
  isPopular: { type: Boolean, default: false }, // Manually set as popular
  isTrending: { type: Boolean, default: false }, // Manually set as trending
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);

export default Product;

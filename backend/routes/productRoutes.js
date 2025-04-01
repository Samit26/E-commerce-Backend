import express from "express";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

const updateUserCart = async (userId, productId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    if (user.userCart.includes(productId)) {
      user.userCart.pull(productId);
    }
    user.userCart.unshift(productId);

    if (user.userCart.length > 5) {
      user.userCart.pop();
    }

    await user.save();
  } catch (error) {
    console.error("Failed to update userCart", error);
  }
};

const updateKeepShoppingFor = async (userId, productId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    if (user.keepShoppingFor.includes(productId)) {
      user.keepShoppingFor.pull(productId);
    }
    user.keepShoppingFor.unshift(productId);

    if (user.keepShoppingFor.length > 5) {
      user.keepShoppingFor.pop();
    }

    await user.save();
  } catch (error) {
    console.error("Failed to update keepShoppingFor", error);
  }
};
const updateProductStats = async (productId, action) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return;

    if (action === "view") {
      product.views += 1;
    } else if (action === "sale") {
      product.sales += 1;
    }

    // Determine if the product should be popular or trending
    product.isPopular = product.sales > 1; // If sales > 100, mark as popular
    product.isTrending = product.views > 1;
    // &&
    // Date.now() - product.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

    await product.save();
  } catch (error) {
    console.error("Failed to update product stats", error);
  }
};

// Create a new product
router.post("/addProduct", async (req, res) => {
  const product = new Product({
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    category: req.body.category,
    brand: req.body.brand,
    stock: req.body.stock,
    images: req.body.images,
    sales: req.body.sales,
    views: req.body.views,
    rating: {
      average: req.body.rating?.average || 0, // Handle undefined case
      ratingCount: req.body.rating?.ratingCount || 0,
      reviews: req.body.rating?.reviews || [],
    },
    isPopular: req.body.isPopular,
    isTrending: req.body.isTrending,
  });

  try {
    const newProduct = await product.save();
    if (!newProduct) {
      return res.status(400).json("Product not saved");
    }
    res.status(201).json({ message: "Product Created", product: newProduct });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/popular", async (req, res) => {
  try {
    const popularProducts = await Product.find({ isPopular: true }).limit(4);
    res.json(popularProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/trending", async (req, res) => {
  try {
    const trendingProducts = await Product.find({ isTrending: true }).limit(5);
    res.json(trendingProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/electronic", async (req, res) => {
  const electronicProducts = await Product.find({
    category: "ELECTRONIC",
  }).limit(5);
  if (electronicProducts) {
    res.json(electronicProducts);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

router.get("/get/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    if (false) {
      updateKeepShoppingFor(req.user._id, product._id);
    }
    updateProductStats(product._id, "view");

    res.json(product);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

router.get("/userCart", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return;
  if (user.userCart.length > 0) {
    res.json(user.userCart);
  } else {
    res.json({ message: "Cart is empty" });
  }
});

router.get("/userAddToCart/:id", protect, async (req, res) => {
  const productId = req.params.id;
  const userId = req.user._id;

  updateUserCart(userId, productId);

  res.json({ message: "Product added to cart" });
});

export default router;

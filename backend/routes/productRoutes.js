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


router.get("/all", async (req, res) => {
  console.log("sending 10 datas...");
  try {
    const products = await Product.aggregate([{ $sample: { size: 10 } }]);
    res.send(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error while searching" });
  }
})

router.get("/search", async (req, res) => {
  const query = req.query.query;

  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } }
      ]
    });

    console.log(products);
    res.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error while searching" });
  }
});

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
    // const popularProducts = await Product.find({ isPopular: true })
    //   .sort({ sales: -1 })
    //   .limit(5);
    const popularProducts = await Product.aggregate([
      { $match: { isPopular: true } }, // Filter only popular products
      { $sort: { sales: -1 } }, // Sort by highest sales first
      { $limit: 5 }, // Get the top 5
      { $sample: { size: 5 } } // Randomize order
    ]);

    res.json(popularProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/trending", async (req, res) => {
  try {
    // const trendingProducts = await Product.find()
    //   .sort({ views: -1 }) // Sort in descending order (higher views first)
    //   .limit(5);

    const trendingProducts = await Product.aggregate([
      { $match: { isTrending: true } }, // Filter only popular products
      { $sort: { views: -1 } }, // Sort by highest sales first
      { $limit: 5 }, // Get the top 5
      { $sample: { size: 5 } } // Randomize order
    ]);
    res.json(trendingProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

router.get("/categories", async (req, res) => {
  try {
    // Get distinct categories
    const categories = await Product.distinct("category");

    // Map categories to include an image
    const categoryData = await Promise.all(
      categories.map(async (category, index) => {
        // Find one product from this category
        const product = await Product.findOne({ category: category });

        return {
          id: index + 1,
          name: category,
          image: product?.images?.[0] || "https://via.placeholder.com/150", // Placeholder if no image found
        };
      })
    );

    res.json(categoryData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/brands", async (req, res) => {
  try {
    // Get distinct brands
    const brands = await Product.distinct("brand");

    // Map brands to include an image
    const brandsData = await Promise.all(
      brands.map(async (brand, index) => {
        // Find one product from this brand
        const product = await Product.findOne({ brand: brand });

        return {
          id: index + 1,
          name: brand,
          image: product?.images?.[0] || "https://via.placeholder.com/150", // Placeholder if no image found
        };
      })
    );

    res.json(brandsData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/category/:category", async (req, res) => {
  try {
    const category = req.params.category;

    // Create a case-insensitive regex pattern to match any word in the category
    const regex = new RegExp(category.split(" ").join("|"), "i");

    const products = await Product.find({ category: { $regex: regex } })
      .sort({ views: -1 })
      .limit(10);

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this category" });
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/brand/:brand", async (req, res) => {
  try {
    const brand = req.params.brand;

    // Create a case-insensitive regex pattern to match any word in the category
    const regex = new RegExp(brand.split(" ").join("|"), "i");

    const products = await Product.find({ brand: { $regex: regex } })
      .sort({ views: -1 })
      .limit(10);

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found in this category" });
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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

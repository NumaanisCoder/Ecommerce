const express = require('express');
const { getAllProducts, createProduct, updateProduct, deleteProduct, getProductDetails } = require('../controllers/productcontroller');

const router = express.Router();

router.route("/products").get(getAllProducts);
router.route("/product/:id").get(getProductDetails);
router.route("/products/new").post(createProduct);
router.route("/products/:id").put(updateProduct).delete(deleteProduct);

module.exports = router;
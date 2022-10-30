const express = require('express');
const { getAllProducts, createProduct, updateProduct, deleteProduct, getProductDetails } = require('../controllers/productcontroller');

const { isAuthenticatedUser,authorizeRoles } = require('../middleware/auth');


const router = express.Router();

router.route("/products").get(getAllProducts);


// Securing all admin resources for users.
router.route("/admin/products/new").post(isAuthenticatedUser,authorizeRoles("admin"), createProduct);

// Securing all admin resources for users.
router.route("/admin/products/:id").put(isAuthenticatedUser,authorizeRoles("admin"), updateProduct).delete(isAuthenticatedUser,authorizeRoles("admin"), deleteProduct);

router.route("/products/:id").get(getProductDetails);



module.exports = router;
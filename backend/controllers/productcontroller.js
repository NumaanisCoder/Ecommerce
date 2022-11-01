const ProductModel = require("../Models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const ApiFeature = require("../utils/apifeatures");

//Create Product -- Admin
exports.createProduct = catchAsyncError(async (req, res, next) => {

    //Fetching ID of person who is creating a product because one or more admin can exist.
    req.body.user = req.user.id;

    const product = await ProductModel.create(req.body);
    res.status(201).json({
        success: true,
        product
    });
});

//Get all products.
exports.getAllProducts = catchAsyncError(async (req, res) => {
    const resultPerPage = 5;
    const productCount = await ProductModel.countDocuments();
    const apiFeature = new ApiFeature(ProductModel.find(), req.query).search().filter().pagination(resultPerPage);
    const product = await apiFeature.query;
    res.status(200).json({
        success: true,
        product,
        productCount
    });
});

//Get Product details
exports.getProductDetails = catchAsyncError(async (req, res, next) => {

    //Taking Product count.

    const product = await ProductModel.findById(req.params.id);


    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({

        success: true,
        product,
        //we also need to look into productCount
    });
});

//Update Products. --Admin
exports.updateProduct = catchAsyncError(async (req, res, next) => {

    let product = await ProductModel.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    product = await ProductModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    });

    res.status(200).json({
        success: true,
        product
    })
});

//Delete Product. --Admin

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
    let product = await ProductModel.findById(req.params.id);

    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product delete successfully !"
    })
});


//Create NEW Review or Update the review 

exports.createProductReview = catchAsyncError(async (req,res,next) =>{


    const {rating,comment, productId} = req.body;

    const review = {
        user:req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment
    }

    const product = await Product.findById(productId);

    //finding the user id from review key {schema}
    const isReviewed = product.reviews.find(
        rev => rev.user.toString() === req.user._id.toString()
    );


    if(isReviewed){
        product.review.forEach(rev => {
            if(rev.user.toString() === req.user._id.toString())
            (rev.rating = rating), (rev.comment = comment)
        });

    }else{
        product.reviews.push(review)
        product.numofReviews = product.reviews.length
    }

    //Calculating Product Average Rating
    let avg = 0
    product.reviews.forEach(rev =>{
        avg = avg+rev.rating
    })
    product.ratings = avg / product.reviews.length;

    await product.save({runValidators: false});

    res.status(200).json({
        success: true
    })
})
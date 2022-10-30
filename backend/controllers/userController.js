const ErrorHandler = require("../utils/errorhandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const UserModel = require("../Models/userModel");
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');


//Register user.

exports.registerUser = catchAsyncError( async(req,res,next) => {

    const userEmail = await UserModel.findOne({email: req.body.email});

    if(userEmail){
        return next(new ErrorHandler("User already exist",400));
    } else {
        const {name,email,password} = req.body;
    
        const user = await UserModel.create({
            name,email,password,
            avatar:{
                public_id:"this is a sample id",
                url:"profilePicUrl"
            }
        });
    
        sendToken(user,201,res);
    }
});

//Login user.
exports.loginUser = catchAsyncError(async(req,res,next) => {
    const {email,password} = req.body;

    //Checking if user has given password and email both.
    if(!email || !password){
        return next(new ErrorHandler("Please enter email & password",400));
    }

    //Query for checking details of a user.
    const user = await UserModel.findOne({email}).select("+password");

    //Suppose user is not available in DB.
    if(!user){
        return next(new ErrorHandler("Invalid email or password",401));
    }


    //comparing password with stored password.
    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        // console.log("checking very fast")
        return next(new ErrorHandler("Invalid email or password"),401);
    }
    //If matched then will generate a token for login.
    sendToken(user,200,res);

});


exports.logout = catchAsyncError(async(req,res,next) => {

    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly: true,
    })


    res.status(200).json({
        success:true,
        message: " Logged out",
    })
});

//Forgot Password
exports.forgotPassword = catchAsyncError(async(req,res,next)=>{
    const user = await UserModel.findOne({email: req.body.email});

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }
    //Getting resetPassword Token
    const resetToken = user.getResetPasswordToken();

    await user.save({validatorBeforeSave: false});
    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message = `Your Password token is : \n\n ${resetPasswordUrl} \n\nIf you have not requested to this email then, please ignore it.`

    try{

        await sendEmail({  
            email: user.email,
            subject: `Ecommerce password recovery`,
            message,

        })

        res.status(200).json({
            success:true,
            message:`Email sent to ${user.email} Sucessfully`,
        })

    }catch(error){
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({validateBeforeSave: false});
        return next(new ErrorHandler(error.message, 500));

    }
});

//Reset Password

exports.resetPassword = catchAsyncError(async(req,res,next)=>{

    //Creating token hash
    const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

    const user = await UserModel.findOne({
        resetPasswordToken,
        resetPasswordExpire: {$gt: Date.now()},
    });

    if(!user){
        return next(new ErrorHandler("Reset password token is invalid or expired",400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not match",400));
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user,200,res);
});

//Get user details

exports.getUserDetails = catchAsyncError(async(req, res, next) => {

    const user = await UserModel.findById(req.user.id);

    res.status(200).json({
        success:true,
        user,
    });
});

//Update user password

exports.updatePassword = catchAsyncError(async(req, res, next) => {
    
    const user = await UserModel.findById(req.user.id).select("+password");
    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if(!isPasswordMatched){
        return next(new ErrorHandler("Old Password is incorrect",400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandler("Password does not matched",400));
    }

    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200, res);
});

//Update user profile data{admin}

exports.updateUserProfile = catchAsyncError(async(req,res,next) => {
    const userNewDetails = {
        name : req.body.name,
        email : req.body.email,
    };

    const user = await UserModel.findByIdAndUpdate(req.user.id, userNewDetails, {
        new:true,
        runValidators:true,
        useFindAndModify:false,
    });
    await user.save();


    res.status(200).json({
        success:true,
        user,
    })
})

//Get all user{admin}

exports.getAllUser = catchAsyncError(async(req,res,next) => {
    const users = await UserModel.find();
    res.status(200).json({
        success:true,
        users,
    })
})  


//Get single user detail{admin}

exports.getSingleUser = catchAsyncError(async(req,res,next) => {
    const users = await UserModel.findById(req.params.id);

    if (!users) {
        return next(new ErrorHandler(`User does not exist with Id ${req.params.id}`));
    }

    res.status(200).json({
        success:true,
        users,
    })
})  
const { error } = require("console");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");


// resetPasswordToken
exports.resetPasswordToken = async (req,res) => {
    try{
        // get data 
        const email = req.body.email;

        // user check exist or not 
        const user = await User.findOne({ email: email});

        // if user already exitst , then return a response 
        if(!user){
        return res.status(401).json({
            success:false,
            message:"User is not registerd,Please signup first",
        })
    }

        // generate token 
        const token = crypto.randomUUID();
        // update user by adding token and expiration time 
        const updatedDetails = await User.findOneAndUpdate(
            {email:email},
            {
                token:token,
                resetPasswordExpires:Date.now() + 3600000,
            },
            {new:true}
        );
        // create url 

		const url = `http://localhost:5173/update-password/${token}`;
        // send mail containing the url 
        await mailSender(email,
            "Password Reset Link",
            `Password Reset Link ${url}`
        )
        // return response 
        return res.status(200).json({
            success:true,
            message:"Email send successfully, Please check email and changed Password",
        })

    }
    catch(err){
        return res.status(500).json({
            success:false,
            message:"Something went wrondg while sending reset password email, Please try again",
        })
    }
}

// resetpassword
exports.resetPassword = async (req,res) => {
    try{
        // get data
        const {password,confirmPassword,token} = req.body;
        // validation
        if(password !== confirmPassword){
            // if new password & confirm new password dose not match, return a response 400
            return res.status(400).json({
                success:false,
                message:"The Password & confirm password dose not match"
            })
        }

        // get user details from db using token 
        const userDetails = await User.findOne({token:token});
        // if no entry - invalid token 

        if(!userDetails){
            return res.status(401).json({
                success:false,
                message:"Token is invalid",
            });
        }
        // token time changed 
		if (userDetails.resetPasswordExpires < Date.now()) {
			return res.status(403).json({
				success: false,
				message: `Token is Expired, Please Regenerate Your Token`,
			});
		}
        // hash password 
        const hashedPassword = await bcrypt.hash(password,10);
        // password update 
        await User.findOneAndUpdate(
            {token:token},
            { password:hashedPassword },
            { new:true }
        );
        // return response 
        return res.status(200).json({
            success:true,
            message:"Password reset successfull",
        })

    }
    catch(err){
        return res.status(500).json({
            success:false,
            error:err.message,
           
        })
    }

}


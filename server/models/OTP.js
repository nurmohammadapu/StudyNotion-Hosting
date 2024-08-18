const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");



const OTP = new mongoose.Schema({

    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    cratedAt:{
        type:Date,
        default:Date.now(),
        expires: 5*60,
    },
    
});


// a function to send otp to user 
async function sendVerificationEmail (email,otp)  {
    try{
        const mailResponse = await mailSender(email,"Verification Email from StudyNotion", emailTemplate(otp));
        console.log("Email sent Successfully:" , mailResponse);
    }
    catch(err){
        console.log("Failed to send Verification Mail:", err);
        throw err;
    }
}
OTP.pre("save", async function(next){
    console.log("New document saved to database");

	// Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
    next();

})

module.exports = mongoose.model("OTP", OTP);
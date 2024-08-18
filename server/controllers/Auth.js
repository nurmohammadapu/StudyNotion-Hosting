const bcrypt = require("bcrypt");
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");

const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const { instructorApprovalConfirmation, instructorDenial,userCreationConfirmation ,instructorApproval } = require("../mail/templates/instructorApprovalConfirmation");

const Profile = require("../models/Profile");
require("dotenv").config();

// Signup Controller for Registering Users
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).send({
        success: false,
        message: "All Fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match. Please try again.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in to continue.",
      });
    }

    const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
    if (response.length === 0 || otp !== response[0].otp) {
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let approved = true;
    if (accountType === "Instructor") {
      approved = false;

      // Fetch admin email from database
      const admin = await User.findOne({ accountType: "Admin" }).select("email");
      const adminEmail = admin?.email;

      await mailSender(
        adminEmail,
        "New Instructor Approval Request",
        instructorApproval(firstName, lastName, email)
      );
    }

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType: accountType,
      approved: approved,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    await mailSender(
      email,
      "Account Created Successfully",
      userCreationConfirmation(firstName, lastName, accountType)
    );

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    });
  }
};

// Login controller for authenticating users
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please Fill up All the Required Fields",
      });
    }

    const user = await User.findOne({ email }).populate("additionalDetails");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not Registered with Us. Please SignUp to Continue.",
      });
    }

    if (user.accountType === "Instructor" && !user.approved) {
      return res.status(403).json({
        success: false,
        message: "Wait for admin approval to join as Instructor",
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { email: user.email, id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "User Login Success",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Login Failure. Please Try Again.",
    });
  }
};

// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body

    // Check if user is already present
    // Find user with provided email
    const checkUserPresent = await User.findOne({ email })
    // to be used in case of signup

    // If user found with provided email
    if (checkUserPresent) {
      // Return 401 Unauthorized status code with error message
      return res.status(401).json({
        success: false,
        message: `User is Already Registered`,
      })
    }

    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    })
    const result = await OTP.findOne({ otp: otp })
    console.log("Result is Generate OTP Func")
    console.log("OTP", otp)
    console.log("Result", result)
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      })
    }
    const otpPayload = { email, otp }
    const otpBody = await OTP.create(otpPayload)
    console.log("OTP Body", otpBody)
    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
      otp,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({ success: false, error: error.message })
  }
}

// Controller for Changing Password
exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id)

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" })
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      )
      console.log("Email sent successfully:", emailResponse.response)
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      })
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error)
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
}

// getPendingInstructors
exports.getPendingInstructors = async (req, res) => {
  try {
    // Fetch all users with accountType "Instructor" and approved set to false
    const pendingInstructors = await User.find({
      accountType: "Instructor",
      approved: false
    });

    // Check if there are pending instructors
    if (pendingInstructors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No pending instructors found."
      });
    }

    // Send the list of pending instructors
    res.status(200).json({
      success: true,
      message: "Pending instructors retrieved successfully.",
      data: pendingInstructors
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error: Unable to retrieve pending instructors."
    });
  }
};

// manageInstructor
exports.manageInstructor = async (req, res) => {
  try {
    // Extract the instructor's user ID and action from the request body
    const { instructorId, action } = req.body;

    // Find the user by ID
    const instructor = await User.findById(instructorId);

    // Check if the user exists and is an instructor
    if (!instructor || instructor.accountType !== "Instructor") {
      return res.status(404).json({
        success: false,
        message: "Instructor not found or user is not an instructor",
      });
    }

    // Perform action based on the provided action type
    if (action === "approve") {
      // Check if the instructor is already approved
      if (instructor.approved) {
        return res.status(400).json({
          success: false,
          message: "Instructor is already approved",
        });
      }

      // Approve the instructor
      instructor.approved = true;
      await instructor.save();

      // Send a confirmation email to the instructor
      await mailSender(
        instructor.email,
        "Instructor Approval Confirmation",
        instructorApprovalConfirmation(instructor.firstName, instructor.lastName)
      );

      // Respond with a success message
      return res.status(200).json({
        success: true,
        message: "Instructor approved successfully",
      });
      
    } else if (action === "deny") {
      // Remove the instructor from the database
      await User.findByIdAndDelete(instructorId);

      // Send a denial email to the instructor
      await mailSender(
        instructor.email,
        "Instructor Approval Denied",
        instructorDenial(instructor.firstName, instructor.lastName)
      );

      // Respond with a success message
      return res.status(200).json({
        success: true,
        message: "Instructor denied and removed successfully",
      });

    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action specified",
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to manage instructor",
    });
  }
};

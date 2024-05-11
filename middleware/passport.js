const { callbackPromise } = require("nodemailer/lib/shared");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const mongoose = require("mongoose");
const User = require("../models/userModel");
require("dotenv").config();


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECERET,
      callbackURL: "https://aadil.online/google/callback",
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, cb) {
      try {
        
        const { id: googleId, email, _json: { name } } = profile; 
        let user = await User.findOne({ email });

        if (!user) {
       
          const user = new User({
            name, 
            email,
            mobile: googleId,
            password:googleId,
            is_admin: 0,
            is_verified: 1,
            is_blocked: false,
          });
          await user.save();
        }
        return cb(null, user ,{ successRedirect: "",});
      } catch (error) {
        console.log(error.message);
      }
    }
  )
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
})

passport.deserializeUser(function (user, cb) {
  cb(null, user);
});


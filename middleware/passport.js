const { callbackPromise } = require("nodemailer/lib/shared");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const mongoose = require("mongoose");
const User = require("../models/userModel");
require("dotenv").config();


// mongoose.connect("mongodb://127.0.0.1:27017/furniture_ecommerce").then(() => {
//   passport.use(
//     new GoogleStrategy(
//       {
//         clientID: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECERET,
//         callbackURL: "http://localhost:7777/google/callback",
//         passReqToCallback: true,
//       },
//       async function (request, accessToken, refreshToken, profile, cb) {
//         try {
//           const { id: googleId, email, displayName: name } = profile;
//           // Search for the user in the database based on Google profile ID
//           let user = await User.findOne({ email: profile._json.email });
          
//           if (!user) {
//             // Create a new user if not found in the database
//             const user = new User({
//               name: profile.name,
//               email: profile.email,
//               mobile: profile.id,
//               is_admin: 0,
//               is_verified: 1,
//               is_blocked: false,
//             });
//             await user.save();
//             refreshToken.displayName;
//           }
//           return cb(null, user, { successRedirect: "/google" });
//         } catch (error) {
//           console.log(error.message);
//         }
//       }
//     )
//   );
// });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECERET,
      callbackURL: "http://localhost:7777/google/callback",
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, cb) {
      try {
        
        const { id: googleId, email, _json: { name } } = profile; 
       
        let user = await User.findOne({ email });

        if (!user) {
       
          user = new User({
            name, 
            email,
            mobile: googleId,
            is_admin: 0,
            is_verified: 1,
            is_blocked: false,
          });
          await user.save();
        }
        return cb(null, user, { successRedirect: "/google",});
      } catch (error) {
        console.log(error.message);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});


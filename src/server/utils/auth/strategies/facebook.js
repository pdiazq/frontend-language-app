const passport = require("passport");
const axios = require("axios");
const boom = require("@hapi/boom");
const { get } = require("lodash");
const { Strategy: FacebookStrategy } = require("passport-facebook");
import dotenv from 'dotenv'

dotenv.config();


passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "/auth/facebook/callback",
    profilerFields: ["id", "email", "displayName"]
  },
  async function(accessToken, refreshToken, profile, done) {
      const { data, status } = await axios({
        url: `${process.env.API_URL}/api/auth/sign-provider`,
        method: "post",
        data: {
            name: profile.name,
            email: profile.email,
            password: profile.id,
            apiKeyToken: process.env.API_KEY_TOKEN
        }
      });

      if (!data || status !== 200) {
        return cb(boom.unauthorized(), false);
      }

      return cb(null, data);
  }
));
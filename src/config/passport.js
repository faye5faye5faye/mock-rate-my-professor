const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const Users = mongoose.model('Users');

passport.use(new LocalStrategy(
  function(username, password, done){
      Users.findOne({username:username}, function(err, user){
        console.log(user)
  			if(err){
  				return done(err);
  			}
  			if(!user){
  				return done(null, false, {message: 'Incorrect Username'});
  			}
  			if(!user.validatePassword(password)){
  				return done(null, false, {message: 'Incorrect Password'});
  			}
  			return done(null, user);
  		});
}));



passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
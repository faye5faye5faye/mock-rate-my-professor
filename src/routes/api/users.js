const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');

//POST new user route (optional, everyone has access)
router.post('/signup', auth.optional, (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const user = {username:username, password:password};

  if(!user.username) {
    return res.redirect('../../../signup'); 
  }

  if(!user.password) {
    return res.redirect('../../../signup'); 
  }

  const finalUser = new Users(user);

  finalUser.setPassword(user.password);

  return finalUser.save()
    .then(() => {
      res.cookie('id', req.sessionID);
      res.cookie('username', finalUser.username);
      res.redirect('../../../homepage'); 
    });
});

//POST login route (optional, everyone has access)
router.post('/login', (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  const user = {username:username, password:password};

  // basic validation:
  if(!user.username) {
    return res.status(422).json({
      errors: {username: 'is required'}
    });
  }

  if(!user.password) {
    alert('password is required'); 
    return res.status(422).json({
      errors: {password: 'is required'}
    });
  }

  return passport.authenticate('local', (err, passportUser, info) => {
    if(err) {
      return next(err);
    }

    if(passportUser) {
      req.login(passportUser, (err) => {
        if(err){
          console.log(err)
          res.send('Error!'); 
        }else{
           passport.serializeUser(passportUser, (err)=>{
            res.cookie('id', req.sessionID);
            res.cookie('username', passportUser.username);
            res.redirect(`../../../homepage`);
          });
        }
      }); 
    }else{
      return res.redirect('../../../login');
    }
  })(req, res, next);
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  const { payload: { id } } = req;

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.sendStatus(400);
      }

      return res.json({ user: user.toAuthJSON() });
    });
});

module.exports = router;
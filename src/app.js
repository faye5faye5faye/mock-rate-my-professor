const express = require('express');
require('./models/Users.js');
require('./config/passport.js');
require('./routes/api/users.js');
const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');
const passport = require('passport'); 
const path = require('path');
const session = require("express-session"); 
const bodyParser = require("body-parser");
const errorHandler = require('errorhandler');
const cors = require('cors');
const db = require('./db.js');
const Professor = mongoose.model('Professor');
const Class = mongoose.model('Class');
const Users = mongoose.model('Users');
const flash = require('connect-flash');
const LocalStrategy = require('passport-local').Strategy;
const auth = require('./routes/auth.js');
const cookieParser = require('cookie-parser')

const app = express();
app.set('view engine', 'hbs');
passport.authenticate('local', { failureFlash: 'Invalid username or password.' });
passport.authenticate('local', { successFlash: 'Welcome!' });
app.use(express.urlencoded({extended: false}));
app.use(cors());
app.use(express.static("public"));
app.use(require('morgan')('dev'));


app.use(express.static(path.resolve(__dirname, '../public'))); 
app.use(session({ secret: "cats" }));
app.use(cookieParser());
app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: true }
	}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.session());
app.use(session({ secret: 'passport-tutorial', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));
app.use(require('./routes')); 


mongoose.promise = global.Promise;

//Configure Mongoose
mongoose.connect('mongodb://localhost/js9950');
mongoose.set('debug', true);


app.get('/', (req, res)=>{
	res.redirect('/login');
});


app.get('/login', (req, res)=>{
	res.render('login');
});


app.get('/signup', (req, res)=>{
	res.render('signup');
});


// this is the find by professor name
app.get('/homepage', (req, res) => {
	const idcheck = req.cookies.username; 
	let idflag = true; 
	Users.findOne({username: idcheck}, (err, content) => {
		if(err){
			res.send('Error!'); 
		}else if(content === null){
			res.redirect('/login'); 
		}else{
			let prof; 
			prof = sanitize(req.query.name);

			if(prof){
				Professor.findOne({name: prof}, function(err, content){
					if(err){
						res.send(err); 
					}else if(content === null){
						res.render('homepage', {text: 'no this professor yet'})
					}else{
						res.render('homepage', {professor: content});
					}
				});
			}else{
				res.render('homepage');
			}	
		}
	}); 
}); 


app.get('/homepage/:prof', (req, res) => {
	const idcheck = req.cookies.username; 
	Users.findOne({username: idcheck}, (err, content) => {
		if(err){
			res.send('Error!'); 
		}else if(content === null){
			res.redirect('/login'); 
		}else{
			const each = sanitize(req.params.prof); 
			Professor.findOne({name: each}, (err, content) => {
				if(err){
					res.send(err); 
				}else if(content.length == 0){
					res.render('each', {text: 'no professor exists.. maybe add him/her?'});
				}else{
					const showclass = content['class'].reduce((acc, val) => {
						if(val !== ''){
							acc.push(val); 
						}
						return acc; 
					}, []); 
			
					const showcomment = content['comment'].reduce((acc, val) => {
						if(val !== ''){
							acc.push(val); 
						}
						return acc; 
					}, []); 
			
					const showrate = content['rate'].reduce((acc, val) => {
						return acc + parseInt(val); 
					}, 0)/content['rate'].length; 

					res.render('each', {
						name: each, 
						rate: showrate, 
						classcode: showclass, 
						comment: showcomment,
					});
				}
			}); 
		}
	});
}); 


app.post('/homepage/:prof', (req, res) => {
	const each = sanitize(req.params.prof); 
	const rate = sanitize(req.body.rate); 
	const currclass = sanitize(req.body.classcode); 

	Class.findOne({code: currclass}, (err, content) => {
		console.log(content)

		if(content === null){
			const bufferclass = new Class({code: currclass, professors: [each]});
			bufferclass.save((err, content) => {
				if(err){
					res.send(err);
				}else{
					console.log('saved!'); 
				}
			}); 
		}else{
			const list = content['professors']; 
			console.log(list)
			let flag = false; 
			list.forEach((elem) => {
				if(each == elem){
					flag = true;  
				}
			});

			if(!flag){
				Class.findOneAndUpdate({code: currclass}, {$push: {professors: each}}, (err, content) => {
					console.log(content)
				});
			}
		}
	}); 

	const comment = sanitize(req.body.comment); 
	Professor.findOneAndUpdate({name: each}, {$push: {comment: comment}}, (err, content) => {
		if(err){
			console.log(err); 
		}
	}); 

	Professor.findOne({name: each}, (err, content) => {
		const arr = content['class']; 
		let flag = false; 
		arr.forEach((elem) => {
			if(elem == currclass){
				flag = true; 
			}
		});
		if(!flag){
			Professor.findOneAndUpdate({name: each}, {$push: {class: currclass}}, (err, content) => {
				if(err){
					console.log(err); 
				}
			});
		}
	}); 


	Professor.findOneAndUpdate({name: each}, {$push: {rate: rate}}, (err, content) => {
		if(err){
			console.log(err); 
		}


	Professor.findOne({name: each}, (err, content) => {
		const showclass = content['class'].reduce((acc, val) => {
			if(val !== ''){
				acc.push(val); 
			}
			return acc; 
		}, []); 
			
		const showcomment = content['comment'].reduce((acc, val) => {
			if(val !== ''){
				acc.push(val); 
			}
			return acc; 
		}, []); 
			
		console.log(content['rate'])
		let showrate = content['rate'].reduce((acc, val) => {
			return acc + parseInt(val); 
		}, 0); 

		showrate = showrate/content['rate'].length;

		res.render('each', {
			name: each, 
			rate: showrate, 
			classcode: showclass, 
			comment: showcomment,
		});
	}); 
})
});



app.get('/allProfessor', (req, res) => {
	const idcheck = req.cookies.username; 
	Users.findOne({username: idcheck}, (err, content) => {
		if(err){
			res.send('Error!'); 
		}else if(content === null){
			res.redirect('/login'); 
		}else{
			Professor.find(function(err, content){
				if(err) {
					res.render('all', {err: err}); 
				}else{
					res.render('all', {prof: content}); 
				}
			});
		}
	}); 
});


app.get('/newProfessor', (req, res) => {
	const idcheck = req.cookies.username; 
	Users.findOne({username: idcheck}, (err, content) => {
		if(err){
			res.send('Error!'); 
		}else if(content === null){
			res.redirect('/login'); 
		}else{
			res.render('new');
		}
	});
});


app.post('/newProfessor', (req, res) => {
	const buffer = {};
	buffer['name'] = sanitize(req.body.prof); 
	buffer['classNumber'] = sanitize(req.body.class); 
	buffer['comment'] = sanitize(req.body.comment); 
	buffer['rate'] = sanitize(req.body.rate); 

	Class.findOne({code: buffer['classNumber']}, function(err, content){
		if(err){
			res.render('new')
		}else if(content === null){
			currclass = new Class({code: buffer['classNumber'], professors: [buffer['name']]});
			currclass.save((err, content) => {
				if(err){
					console.log(err); 
				}else{
					console.log('new class saved: ', content); 
				}	
			}); 
		}else{
			const list = content['professors']; 
			let flag = false; 
			list.forEach((elem) => {
				if(elem == buffer['name']){
					flag = true; 
				}
			});
			if(!flag){
				Class.findOneAndUpdate({code: buffer['classNumber']}, {$push: {professors: buffer['name']}}, (err, content) => {
					console.log(content)
				});
			} 
		}

		Professor.findOne({name: buffer['name']}, function(err, content){
		if(err){
			res.send(err); 
		}else if(content === null){
			const newProf = new Professor({
				name: buffer['name'], 
				class : [buffer['classNumber']],
				rate: [buffer['rate']], 
				comment: [buffer['comment']], 
			}); 
			newProf.save(function(err){
				if(err){
					console.log(err);
				}
				res.render('new', {text: 'saved!', created: newProf});
			});
		}else{ 
			const arr = content['class']; 
			let flag = false; 
			arr.forEach((elem) => {
				if(elem == buffer['classNumber']){
					flag = true; 
				}
			}); 

			if(!flag){
				Professor.findOneAndUpdate({name: buffer['name']}, {$push: {class: buffer['classNumber']}}, function(err, content){});
			}
			Professor.findOneAndUpdate({name: buffer['name']}, {$push: {rate: buffer['rate']}}, function(err, content){
				Professor.findOneAndUpdate({name: buffer['name']}, {$push: {comment: buffer['comment']}}, function(err, curr) {
					if(err){
						console.log(err); 
					}else{
						res.render('new', {text: 'already exists! updated!'});
					}
				});
			});
		}
	});
	}); 
});


app.get('/searchClass', (req, res) => {
	const idcheck = req.cookies.username; 
	Users.findOne({username: idcheck}, (err, content) => {
		if(err){
			res.send('Error!'); 
		}else if(content === null){
			res.redirect('/login'); 
		}else{
			const classcode = sanitize(req.query.code); 

			if(classcode === undefined){
				res.render('class'); 
			}else if(classcode === ''){
				res.render('class'); 
			}else if(classcode !== ''){
				Class.findOne({code: classcode}, function(err, content){
					console.log(content)
					if(err){
						res.render('class', {text: 'something wrong happened :('}); 
					}else if(content === null){
						res.render('class', {text: 'no record yet'}); 
					}else{
						if(content['professors'].length === 0){
							res.render('class', {text: 'no record of professors who have taught this course'}); 
						}else{
							res.render('class', {text: 'these professors have taught this class', array: content['professors']}); 
						}
					}
				});
			}else{
				res.render('class'); 
			}
		}
	}); 
}); 



app.listen(process.env.PORT || 3000);

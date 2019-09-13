// db.js
const mongoose = require('mongoose'); 
const URLSlugs = require('mongoose-url-slugs');

// set the two schemas
const ClassSchema = new mongoose.Schema({
	name: String, 
	code: {type : Number, required: true}, 
	professors: {type : Array, default : []},  
});


const ProfessorSchema = new mongoose.Schema({
	name: {type : String, required: true}, 
	email: {type: String},
	rate: {type : Array, default : []}, 
	class: {type : Array, default : []},
	comment: {type : Array, default : []},  
});


// register for models
const Professor = mongoose.model('Professor', ProfessorSchema); 
const Class = mongoose.model('Class', ClassSchema); 

// mongoose.model("Reviews", ReviewSchema); 
mongoose.Promise = global.Promise;


// is the environment variable, NODE_ENV, set to PRODUCTION? 

let dbconf;
if(process.env.NODE_ENV === 'PRODUCTION') {
	// if we're in PRODUCTION mode, then read the configration from a file
	// use blocking file io to do this...
	const fs = require('fs');
	const path = require('path');
	const fn = path.join(__dirname, 'config.json');
	const data = fs.readFileSync(fn);

	// our configuration file will be in json, so parse it and set the
	// conenction string appropriately!
	const conf = JSON.parse(data);
	dbconf = conf.dbconf;
}else{
	// if we're not in PRODUCTION mode, then use
	dbconf = 'mongodb://localhost/js9950';
}


mongoose.connect(dbconf);


module.exports = {
	Professor, Class
};


//mongodb://USERNAME:PASSWORD@class-mongodb.cims.nyu.edu/USERNAME
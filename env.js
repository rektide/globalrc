"use strict"

var
  camelCase= require( "camelcase"),
  Path= require( "path"),
  xdgBasedir= require( "xdg-basedir")

var props= [ "configurable", "enumerable"]

/**
 * Create an object with getters for the specified or default environment
 */
function env( opts){
	// env initialization
	opts= opts|| {}
	var
	  // globalrc config to look for, path to it
	  name= opts.name|| process.env.GLOBALRC|| "globalrc",
	  dir= Path.isAbsolute( name)? name: Path.join( xdgBasedir.config, name),
	  // result gets these properties defined on it
	  properties= {},
	  // variable declaration text that pulls in all properties
	  commonjs= [ "var "]

	function add( name, path){
		var property= buildProperty( dep, path, opts)
		if( !property){
			return
		}
		var camel= property.camel

		// install dependency camelcase
		properties[ camel]= property

		// build text
		commonjs.push( commonjs.length > 1? ", ": "", camel, "= require('", path, "')")
	}
	function tryAdd( name, path){
		try{
			require( path)
			add( name, path)
			return true
		}catch(ex){
			return false
		}
	}

	// at the lowest precedence of imports, globalrc exposes all dependencies - it's the simplest use of globalrc, pulling in libraries
	var
	  pkgPath= Path.join( dir, "package.json"),
	  pkgJson= require( pkgPath)
	for( var dep in pkgJson.dependencies){
		var path= Path.join( dir, "node_modules", dep)
		add( dep, path)
	}

	// next, pull in the special globalrc file
	var
	  foundGlobalrcJs= false,
	  globalrc= Path.join( dir, "globalrc.js"),
	  globalrcHidden= Path.join( dir, ".globalrc.js"),
	  globalFiles= [ globalrc, globalrcHidden]
	for( var i in globalFiles){
		var
		  file= globalFiles[ i],
		  added= tryAdd( "globalrc", file)
		if( added){
			foundGlobalrcJs= true
		}
	}

	// if there is no globalrc.js file, import the top level exports of the moduel
	if( !foundGlobalrcJs){
		tryAdd( "globalrc", dir)
	}

	// build synthetic props
	// synthetic property that generates a string that would create variable declarations for everything in globalrc
	commonjs= commonjs.concat( ";").join( "")
	properties._commonjs= {
		value: commonjs
	}
	// add everything in globalrc into the global object (whether that's window, global, self, root)
	properties._globalize= {
		value: function(){
			return require( "./globalize")( modules)
		}
	}

	// resultant set of exposed things
	var modules= {}
	Object.defineProperties( modules, properties)
	return modules
}

function buildProperty( name, path, opts){
	var val,
	  camel= camelCase(name),
	  notExist= function(){
		var err= Error( `Module '${name}' should have had a value.`)
		err.moduleName= name
		return err
	  },
	  build= function(){
		// fetch module
		val= require( path)

		// verify we have a module
		if( !val){
			throw notExist()
		}

		// set 'invisible' meta-data properties on the module's exports
		if( val._name){
			var err= new Error( `'${dep}' already has '_name' property`)
			err.moduleName= dep
			err.alreadyHas= "_name"
			throw err
		}

		if( val._name){
			var err= new Error( `'${dep}' already has '_camel' property`)
			err.moduleName= dep
			err.alreadyHas= "_camel"
			throw err
		}
		if( val._path){
			var err= new Error( `'${dep}' already has '_path' property`)
			err.moduleName= dep
			err.alreadyHas= "_path"
			throw err
		}
		Object.defineProperties( val, {
			_path: {
				value: path
			},
			_name: {
				value: name
			},
			_camel: {
				value: camel
			}
		})

		// install shortcut getter, releasing this function
		build= getter

		// return
		return val
	  },
	  getter= function(){
		return val
	  },
	  get= function(){
		return build()
	  },
	  property= Object.assign( {}, opts, {
		get,
		camel,
		enumerable: true,
		configurable: true
	  })
	return property
}

module.exports= env
module.exports.env= env

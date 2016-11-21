"use strict"

var
  camelCase= require( "camelcase"),
  Path= require( "path"),
  xdgBasedir= require( "xdg-basedir")

var configDir= xdgBasedir.config
var props= [ "configurable", "enumerable"]

/**
 * Create an object with getters for the specified or default environment
 */
function env( name, opts){
	name= name|| "globalrc"
	opts= opts|| {}
	var
	  globalrcPath= Path.isAbsolute( name)? name: Path.join( configDir, name),
	  pkgPath= Path.join( globalrcPath, "package.json"),
	  pkgJson= require( pkgPath),
	  properties= {},
	  paths= {},
	  modules= {},
	  commonjs= [ "var "]
	for( var dep in pkgJson.dependencies){
		var
		  camelDep= camelCase(dep),
		  path= Path.join( globalrcPath, "node_modules", dep),
		  property= buildDependency( dep, camelDep, path, opts)

		// install dependency camelcase
		properties[ camelDep]= property

		// build text
		commonjs.push( commonjs.length > 1? ", ": "", camelDep, "= require('", path, "')")
	}
	commonjs= commonjs.concat( ";").join( "")
	properties._commonjs= {
		value: commonjs
	}
	properties._globalize= {
		value: function(){
			return require( "./globalize")( modules)
		}
	}
	Object.defineProperties( modules, properties)
	return modules
}

function buildDependency( name, camelName, path, opts){
	var val,
	  notExist= function(){
		var err= Error( `Module '${name}' should have had a value.`)
		err.moduleName= name
		return err
	  },
	  build= function(){
		// fetch module
		var mod= require( path)

		// verify we have a module
		if( !val){
			throw notExist()
		}

		// set 'invisible' meta-data properties on the module's exports
		if( mod._name){
			var err= new Error( `'${dep}' already has '_name' property`)
			err.moduleName= dep
			err.alreadyHas= "_name"
			return err
		}
		if( mod._name){
			var err= new Error( `'${dep}' already has '_camelName' property`)
			err.moduleName= dep
			err.alreadyHas= "_camelName"
			return err
		}
		if( mod._path){
			var err= new Error( `'${dep}' already has '_path' property`)
			err.moduleName= dep
			err.alreadyHas= "_path"
			return err
		}
		Object.defineProperties( mod, {
			_path: {
				value: path
			},
			_name: {
				value: dep
			},
			_camelName: {
				value: camelName
			}
		})

		// install shortcut getter, releasing this function
		build= getter

		// return
		return mod
	  },
	  getter= function(){
		return val
	  },
	  get= function(){
		return build()
	  },
	  property= Object.assign( {}, opts, {
		get,
		enumerable: true,
		configurable: true
	  })
	return property
}

module.exports= env
module.exports.env= env

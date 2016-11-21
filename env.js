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
	  deps= require( pkgPath).dependencies,
	  properties= {},
	  paths= {},
	  modules= {},
	  commonjs= [ "var "]
	if( !deps){
		var err= new Error( `Expected to find a '${pkgPath}'`)
		err.path= pkgPath
		throw err
	}
	for( var dep in deps){
		var
		  camelDep= camelCase(dep),
		  path= Path.join( globalrcPath, "node_modules", dep),
		  prop= (function( dep, path){
			var val,
			  notExist= function(){
				return new Error( `Module '${dep}' should have had a value.`)
			  },
			  build= function(){
				// fetch module
				var mod= require( path)

				// set 'invisible' meta-data properties on the module's exports
				if( mod._path){
					var err= new Error( `'${dep}' already has '_path' property`)
					err.dependency= dep
					return err
				}
				if( mod._name){
					var err= new Error( `'${dep}' already has '_name' property`)
					err.dependency= dep
					return err
				}
				Object.defineProperties( mod, {
					_path: {
						value: path,
						enumerable: false
					},
					_name: {
						value: dep,
						enumerable: false
					}
				})

				// return
				return mod
			  },
			  getter= function(){
				return val
			  },
			  builder= function(){
				val= build()
				if( !val){
					throw notExist()
				}
				builder= getter
				return val
			  },
			  get= function(){
				return builder()
			  },
			  prop= Object.assign( {}, opts, {
				get,
				enumerable: true,
				configurable: true
			  })

			// build text
			commonjs.push( commonjs.length > 1? ", ": "", camelDep, "= require('", path, "')")

			return prop
		  })( dep, path)
		// camelcase dependency
		properties[ camelDep]= prop
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

module.exports= env
module.exports.env= env

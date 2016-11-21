"use strict"

var
  global= require( "global")

/**
 * Append all camel-cased modules of a globalrc to the global object
 */
function globalize(env){
	if( !env){
		env= require( ".")
	}
	for( var i in env){
		global[ i]= env[i]
	}
	return global
}

module.exports= globalize
module.exports.globalize= globalize

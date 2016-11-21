#!/usr/bin/env node
"use strict"

/**
 * Print all modules in the globalrc.
 */
function main( globalrc){
	globalrc= globalrc|| require( ".")
	var names= []
	for( var i in globalrc){
		var name= globalrc[ i]._name
		names.push( name)
	}
	console.log( names)
	return names
}

module.exports= main
module.exports.main= main

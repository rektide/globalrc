#!/usr/bin/env node
"use strct"

var
  _env= require( "./env"),
  _main= require( "./main")

// load a default globalrc
module.exports= _env()

// add additional globalrc member
var
  members= { _env, _main},
  memberProps= {}
for( var name in members){
	var member= members[ name]
	if( module.exports[ name]){
		throw new Error( `'${name}' internal property was already defined.`)
	}
	memberProps[ name]= {
		value: member
	}
}
Object.defineProperties( module.exports, memberProps)

if( require.main=== module){
	module.exports._main()
}

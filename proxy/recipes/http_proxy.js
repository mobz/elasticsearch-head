const httpProxy = require("http-proxy");

module.exports =  function( settings ) {
	const proxy = httpProxy.createProxy( { secure: false } );

	console.log( `\tremote: ${settings.target}` );

	return function( req, res ) {
		proxy.web( req, res, { target: settings.target } );
	};
};

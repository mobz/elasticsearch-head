const httpProxy = require("http-proxy");

module.exports =  function( settings ) {
	const proxy = httpProxy.createProxy( { secure: false } );

	proxy.on('proxyReq', function(proxyReq, req, res, options) {
		if( settings.username ) {
			proxyReq.setHeader( "Authorization", "Basic " + new Buffer(settings.username + ":" + settings.password).toString("base64") );
		}
	});

	function request( req, res ) {
		proxy.web( req, res, { target: settings.target } );
	};

	function close() {
		proxy.close();
	}

	console.log( `\tremote: ${settings.target}` );

	return new Promise( function( resolve, reject ) {
		resolve( {
			request: request,
			close: close
		} );
	} );


};

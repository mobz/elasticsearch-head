const http = require("http");

const recipes = {};
recipes['http-proxy'] = require("./recipes/http_proxy.js");


const clusters = [];
clusters.push( require("./clusters/localhost9200.json") );


clusters.forEach( cluster => {
	if( cluster.enabled ) {
		console.log( `creating proxy ${cluster.name}` );

		const proxy_instance = recipes[ cluster.recipe ]( cluster.settings );
		http.createServer( (req, res ) => {
			console.log( `${req.method} ${cluster.name} ${req.url}` );
			proxy_instance( req, res );
		} ).listen( cluster.bind );

		console.log( `\tlocal:  http://localhost:${cluster.bind}` );
	}
});


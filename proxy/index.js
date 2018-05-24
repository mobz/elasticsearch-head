const http = require("http");

const CORS_SETTINGS = {
	origin: "http://localhost:9100",
	methods: "GET, PUT, POST, DELETE, OPTIONS, HEAD",
	headers: "Authorization, Content-Type"
}


const recipes = {};
recipes['http-proxy'] = require("./recipes/http_proxy.js");


const clusters = [];
clusters.push( require("./clusters/localhost9200.json") );


clusters.forEach( cluster => {
	if( cluster.enabled ) {
		console.log( `creating proxy ${cluster.name}` );

		recipes[ cluster.recipe ]( cluster.settings )
			.then( function( proxy ) {
				const server = http.createServer();
				server.on('request', (req, res ) => {
					console.log( `${req.method} ${cluster.name} ${req.url}` );

					res.setHeader("Access-Control-Allow-Origin", CORS_SETTINGS.origin );
					res.setHeader("Access-Control-Allow-Methods", CORS_SETTINGS.methods );
					res.setHeader("Access-Control-Allow-Headers", CORS_SETTINGS.headers );

					if (req.method === 'OPTIONS') {
						res.writeHead(200);
						res.end();
					} else {
						proxy.request( req, res );
					}
				} );

				server.listen( cluster.bind );
				console.log( `\tlocal:  http://localhost:${cluster.bind}` );
			});
	}
});


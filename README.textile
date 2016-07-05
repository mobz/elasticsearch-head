h1. elasticsearch-head

h2. A web front end for an Elasticsearch cluster

h3. "http://mobz.github.io/elasticsearch-head":http://mobz.github.io/elasticsearch-head

h2. Installing and Running

There are two main ways of running and installing elasticsearch-head

h4. Running as a plugin of Elasticsearch

* Install elasticsearch-head:
  - for Elasticsearch 5.x:
    site plugins are not supported. Run elasticsearch-head "as a standalone server":#running-with-built-in-server
  - for Elasticsearch 2.x - 4.x:
    @sudo elasticsearch/bin/plugin install mobz/elasticsearch-head@
  - for Elasticsearch 1.x:
    @sudo elasticsearch/bin/plugin -install mobz/elasticsearch-head/1.x@
  - for Elasticsearch 0.9:
    @sudo elasticsearch/bin/plugin -install mobz/elasticsearch-head/0.9@

* @open http://localhost:9200/_plugin/head/@

This will automatically download the latest version of elasticsearch-head from github and run it as a plugin within the elasticsearch cluster. In this mode;
* elasticsearch-head automatically connects to the node that is running it

Note on different Elasticsearch installation path:
* If you've installed the .deb package, then the plugin executable will be available at @/usr/share/elasticsearch/bin/plugin@.
* If you've installed Elasticsearch via Homebrew, plugin executable will be available at @/usr/local/Cellar/elasticsearch/(elasticsearch version)/bin/plugin@.

h4. Running with built in server

* enable "cors":http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/modules-http.html by adding @http.cors.enabled: true@ in elasticsearch configuration. Don't forget to also set @http.cors.allow-origin@ because no origin allowed by default. @http.cors.allow-origin: "*"@ is valid value, however it's considered as a security risk as your cluster is open to cross origin from *anywhere*. Check Elasticsearch documentation on this parameter:  https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-http.html#modules-http
* @git clone git://github.com/mobz/elasticsearch-head.git@
* @cd elasticsearch-head@
* @npm install@
* @grunt server@
* @open@ "http://localhost:9100/":http://localhost:9100/

This will start a local webserver running on port 9100 serving elasticsearch-head
* Best option if you are likely to connect to several different clusters

h4. Alternatives

h5. Running from the filesystem

elastisearch-head is a standalone webapp written in good-ol' html5. This means, you can put it up on any webserver, run it directly from the filesystem, use it on an iPad, or put it on a floppy disk and carry it with you.

h4. URL Parameters

Parameters may be appended to the url to set an initial state eg. @head/index.html?base_uri=http://node-01.example.com:9200@

* @base_uri@ force elasticsearch-head to connect to a particular node.
* @dashboard@ experimental feature to open elasticsearch-head in a mode suitable for dashboard / radiator. Accepts one parameter @dashboard=cluster@
* @auth_user@ adds basic auth credentials to http requests ( requires "elasticsearch-http-basic":https://github.com/karussell/elasticsearch-http-basic plugin or a reverse proxy )
* @auth_password@ basic auth password as above (note: without "additional security layers":http://security.stackexchange.com/questions/988/is-basic-auth-secure-if-done-over-https, passwords are sent over the network *in the clear* )

h4. Contributing

To contribute to elasticsearch-head you will need the following developer tools

# git and a "github":https://github.com/ account
# "node ( including npm )":http://nodejs.org/download
# "grunt-cli":http://gruntjs.com/getting-started
# (to run jasmine tests) "phantomjs":http://phantomjs.org

Then

# create a fork of elasticsearch-head on github
# clone your fork to your machine
# @cd elasticsearch-head@
# @npm install@ # downloads node dev dependencies
# @grunt dev@ # builds the distribution files, then watches the src directory for changes

Changes to both _site and src directories *must* be committed, to allow people to 
run elasticsearch-head without running dev tools and follow existing dev patterns, 
such as indenting with tabs.

h5. Contributing an Internationalisation


* Chinese by "darkcount":https://github.com/hangxin1940
* English (primary) by "Ben Birch":https://twitter.com/mobz
* French by "David Pilato":https://twitter.com/dadoonet
* Portuguese by "caiodangelo":https://github.com/caiodangelo

To contribute an internationalisation

# Follow "Contributing" instructions above
# Find your 2-character "ISO 639-1 language code":http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
# edit _site/index.html to add your 2 letter language code to the data-langs attribute of this line @<script src="_site/i18n.js" data-baseDir="_site/lang" data-langs="en,fr,your_lang_here"></script>@
# make a copy of @src/app/langs/en_strings.js@ prefixed with your language code
# convert english strings and fragments to your language. "Formatting Rules":http://docs.oracle.com/javase/tutorial/i18n/format/messageintro.html
# Submit a pull request

!http://mobz.github.com/elasticsearch-head/screenshots/clusterOverview.png(ClusterOverview Screenshot)!

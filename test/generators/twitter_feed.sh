#!/bin/sh

curl -XDELETE 'http://localhost:9200/twitter'
echo
curl -XPUT 'http://localhost:9200/twitter'
echo
curl -XPUT 'http://localhost:9200/twitter/_mapping' -d '{
	"tweet": {
		"date_formats": ["date_time", "yyyyMMddHHmmss", "yyyyMMddHHmmssSSS"],
		"properties" : {
			"user" : { "type" : "string", "index" : "not_analyzed" },
			"message" : { "type" : "string" },
			"postDate" : { "type" : "date" },
			"srcAddr" : { "type" : "ip" },
			"priority" : { "type" : "integer", null_value: 1 },
			"rank" : { "type" : "float", null_value: 1.0 },
			"loc" : { "type": "geo_point" }
		}
	}
}'
echo
curl -XPUT 'http://localhost:9200/twitter/tweet/1' -d '{
	"user" : "mobz",
	"message" : "developing a tool to search with",
	"postDate" : "20110220100330",
	"srcAddr" : "203.19.74.11",
	"loc" : "-37.86,144.90"
}'
echo
curl -XPUT 'http://localhost:9200/twitter/tweet/2' -d '{
	"user" : "mobz",
	"message" : "you know, for elastic search",
	"postDate" : "20110220095900",
	"srcAddr" : "203.19.74.11",
	"loc" : "-37.86,144.90"
}'
echo
curl -XPUT 'http://localhost:9200/twitter/tweet/3' -d '{
	"user" : "mobz",
	"message" : "lets take some matilda bay",
	"postDate" : "20110221171330",
	"srcAddr" : "203.19.74.11",
	"loc" : "-37.86,144.90"
}'
echo
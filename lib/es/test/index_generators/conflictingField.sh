#!/bin/sh

curl -XDELETE 'http://localhost:9200/conflicting_field_type'
echo
curl -XPUT 'http://localhost:9200/conflicting_field_type'
echo
curl -XPUT 'http://localhost:9200/conflicting_field_type/map1/_mapping' -d '{
  "map1": {
    "date_formats": ["date_time", "yyyyMMddHHmmss", "yyyyMMddHHmmssSSS"],
    "_all": {
      "enabled": true,
      "store": "yes"
    },
    "properties": {
      "field1": {
        "type": "date",
        "store": "yes",
        "format": "yyyyMMddHHmmssSSS",
        "include_in_all": false
      }
    }
  }
}'
echo
curl -XPUT 'http://localhost:9200/conflicting_field_type/map2/_mapping' -d '{
  "map2": {
    "date_formats": ["date_time", "yyyyMMddHHmmss", "yyyyMMddHHmmssSSS"],
    "_all": {
      "enabled": true,
      "store": "yes"
    },
    "properties": {
      "field1": {
        "type": "string",
        "store": "yes",
        "term_vector": "yes",
        "include_in_all": false
      }
    }
  }
}'
echo
curl -XPUT 'http://localhost:9200/conflicting_field_type/map1/1' -d '{
    "field1" : "20110214172449000"
}'
echo
curl -XPUT 'http://localhost:9200/conflicting_field_type/map2/2' -d '{
    "field1" : "Test map2 with string type field"
}'
echo
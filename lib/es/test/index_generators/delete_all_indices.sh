#!/bin/sh

curl -XDELETE 'http://localhost:9200/conflicting_field_type'
echo
curl -XDELETE 'http://localhost:9200/twitter'
echo

curl -XDELETE 'http://localhost:9200/multi_field_type'
echo
curl -XPUT 'http://localhost:9200/multi_field_type'
echo
curl -XPUT 'http://localhost:9200/multi_field_type/map1/_mapping' -d '{
	"map1": {
		"properties": {
			"field1": {
				"type": "string",
				"store": "yes"
			},
			"field2": {
				"type": "multi_field",
				"path": "full",
				"fields": {
					"field2": { "type": "string" },
					"alt_name": { "type": "string" },
					"alt_name2": { "type": "string" }
				}
			},
			"field3": {
				"type": "multi_field",
				"path": "just_name",
				"fields": {
					"field3": { "type": "string" },
					"foobar": { "type": "string" }
				}
			},
			"field4": {
				"type": "multi_field",
				"path": "just_name",
				"fields": {
					"field4": { "type": "string" },
					"foobar": { "type": "string" }
				}
			},
			"field5": {
				"type": "string"
			}
		}
	}
}'
echo
curl -XPUT 'http://localhost:9200/multi_field_type/map1/1' -d '{
	"field1": "Whats the dogs name",
	"field2": "Max",
	"field3": "Hey Janelle, whats wrong with Wolfie? I can hear him barking",
	"field4": "Wolfies fine, honey, Wolfies just fine. Where are you",
	"field5": "Your foster parents are dead"
}'
echo
curl -XPUT 'http://localhost:9200/multi_field_type/map1/2' -d '{
	"field1": "Nice night for a walk, eh",
	"field2": "Nice night for a walk",
	"field3": "Wash day tomorrow? Nothing clean, right?",
	"field4": "Nothing clean. Right",
	"field5": "Hey, I think this guys a couple cans short of a six-pack"
}'
echo

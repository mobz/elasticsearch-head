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
curl -XPUT 'http://localhost:9200/multi_field_type/map1/3' -d '{
	"field1": "The 600 series had rubber skin. We spotted them easy, but these are new. They look human... sweat, bad breath, everything. Very hard to spot. I had to wait till he moved on you before I could zero him",
	"field2": "Look... I am not stupid, you know. They cannot make things like that yet.",
	"field3": "Not yet. Not for about 40 years",
	"field4": "Are you saying its from the future?",
	"field5": "One possible future. From your point of view... I dont know tech stuff"
}'
echo
curl -XPUT 'http://localhost:9200/multi_field_type/map1/4' -d '{
	"field1": "Did you see this war?",
	"field2": "No. I grew up after. In the ruins... starving... hiding from H-Ks",
	"field3": "H-Ks?",
	"field4": "Hunter-Killers. Patrol machines built in automated factories. Most of us were rounded up, put in camps for orderly disposal",
	"field5": "This is burned in by laser scan. Some of us were kept alive... to work... loading bodies. The disposal units ran night and day. We were that close to going out forever. But there was one man who taught us to fight, to storm the wire of the camps, to smash those metal motherfuckers into junk. He turned it around. He brought us back from the brink. His name is Connor. John Connor. Your son, Sarah, your unborn son"
}'
echo

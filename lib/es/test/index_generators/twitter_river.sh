curl -XDELETE 'http://localhost:9200/twitter_river'
echo
curl -XDELETE 'http://localhost:9200/_river/twitter_river'
echo
curl -XPUT 'http://localhost:9200/twitter_river'
echo
read -p "twitter username: " username
read -p "twitter password: " password
curl -XPUT 'localhost:9200/_river/twitter_river/_meta' -d '
{
    "type" : "twitter",
    "twitter" : {
        "user" : "'${username}'",
        "password" : "'${password}'"
    }
}'
echo
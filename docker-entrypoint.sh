#!/bin/sh
set -e

[ -n "$HOST" ] || ( echo "HOST required - You must supply the FQDN of the public host"; false )

SCHEME=${SCHEME:-http}
USERNAME=${USERNAME:-elasticsearch}
PASSWORD=${PASSWORD:-elasticsearch@123}
ES_HOST=${ES_HOST:-172.17.0.1}
ES_PORT=${ES_PORT:-9200}
PORT=${PORT:-80}

echo "$USERNAME:$(openssl passwd -crypt $PASSWORD 2>/dev/null)" > /etc/nginx/.htpasswd

CONFDIR=/etc/nginx/conf
[ -d /etc/nginx/conf.d ] && CONFDIR=/etc/nginx/conf.d

cat <<EOF > $CONFDIR/default.conf
upstream elasticsearch {
  server $ES_HOST:$ES_PORT;
  keepalive 15;
}
server {
  listen                *:$PORT ;
  server_name           $HOST;
  access_log            /dev/stdout;
  error_log             /dev/stderr;
EOF

if [ "${SCHEME}" == "https" ]; then

cat <<EOF >> $CONFDIR/default.conf
  # Enforce SSL
  if (\$http_x_forwarded_proto != '$SCHEME') {
    rewrite ^ $SCHEME://\$host$request_uri? permanent;
  }
EOF

fi

cat <<EOF >> $CONFDIR/default.conf
  auth_basic "Protected ElasticSearchHQ";
  auth_basic_user_file /etc/nginx/.htpasswd;
  proxy_read_timeout 90;
  proxy_http_version 1.1;
  proxy_set_header Connection "Keep-Alive";
  proxy_set_header Proxy-Connection "Keep-Alive";

  proxy_set_header X-Real-IP \$proxy_add_x_forwarded_for;
  proxy_set_header X-ELB-IP \$remote_addr;
  proxy_set_header X-ELB-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header Host \$http_host;
  proxy_set_header Referer $HOST;

  # For CORS Ajax
  proxy_pass_header Access-Control-Allow-Origin;
  proxy_pass_header Access-Control-Allow-Methods;
  proxy_hide_header Access-Control-Allow-Headers;
  add_header Access-Control-Allow-Headers 'X-Requested-With, Content-Type';
  add_header Access-Control-Allow-Credentials true;

  location = / {
    if (\$request_method = OPTIONS ) {
      add_header Access-Control-Allow-Origin "$SCHEME://$HOST";
      add_header Access-Control-Allow-Methods "GET, OPTIONS";
      add_header Access-Control-Allow-Headers "Authorization";
      add_header Access-Control-Allow-Credentials "true";
      add_header Content-Length 0;
      add_header Content-Type text/plain;
      return 200;
    }

    proxy_pass http://elasticsearch;

    expires max;
    access_log on;
  }
  location / {
    root /app;

    if (\$request_method = OPTIONS ) {
      add_header Access-Control-Allow-Origin "$SCHEME://$HOST";
      add_header Access-Control-Allow-Methods "GET, OPTIONS";
      add_header Access-Control-Allow-Headers "Authorization";
      add_header Access-Control-Allow-Credentials "true";
      add_header Content-Length 0;
      add_header Content-Type text/plain;
      return 200;
    }

    index index.html;

    try_files \$uri \$uri/ @proxypass;

    expires max;
    access_log on;
  }

  location @proxypass {
    proxy_pass http://elasticsearch;
  }
}
EOF

# Starting nginx
exec nginx -g "daemon off;"

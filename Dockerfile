FROM ubuntu

RUN apt-get update && \
   apt-get install -y npm && \
   npm install -g grunt-cli && \
   ln -s /usr/bin/nodejs /usr/bin/node

ADD . /opt/es-head
WORKDIR /opt/es-head

RUN npm install
EXPOSE 9100
CMD ["/usr/local/bin/grunt", "server"]

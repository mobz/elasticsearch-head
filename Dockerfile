# Pull base image.
FROM iojs
MAINTAINER Tim Ehlers <ehlerst@gmail.com>

# Copy files
COPY src /opt/head/src
COPY _site /opt/head/_site
COPY *json /opt/head/
COPY *.js /opt/head/
COPY LICENCE /opt/head/LICENCE
COPY index.html /opt/head/index.html

# Define working directory.
WORKDIR /opt/head

RUN npm install -g grunt-cli
RUN npm install


ADD scripts/run.sh /run.sh
CMD ["/run.sh"]

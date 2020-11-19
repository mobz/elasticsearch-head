FROM node
MAINTAINER Niko Bellic <niko.bellic@kakaocorp.com>

# wrap Node.js process with tini to handle stop signal
ENV TINI_VERSION v0.16.1
RUN wget -O /tini https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini \
    && chmod +x /tini

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g grunt

COPY package.json /usr/src/app/package.json
RUN npm install

COPY . /usr/src/app

EXPOSE 9100

ENTRYPOINT ["/tini", "--"]
CMD ["grunt", "server"]

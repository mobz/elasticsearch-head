# docker build -t mobz/elasticsearch-head:5-alpine -f Dockerfile-alpine .

FROM node:alpine
WORKDIR /usr/src/app
RUN npm install http-server
COPY . .
EXPOSE 9100
CMD node_modules/http-server/bin/http-server _site -p 9100

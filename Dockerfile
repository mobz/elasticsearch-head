FROM ubuntu:precise

MAINTENR James Raymond Carr "james.r.carr@gmail.com"

# Java 7
RUN echo "deb http://ppa.launchpad.net/webupd8team/java/ubuntu precise main" | tee -a /etc/apt/sources.list
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys EEA14886
RUN apt-get update
RUN echo oracle-java7-installer shared/accepted-oracle-license-v1-1 select true | /usr/bin/debconf-set-selections
RUN apt-get install oracle-java7-installer -y

# elasticsearch
RUN apt-get install wget -y
RUN wget --no-check-certificate https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-0.90.5.tar.gz
RUN tar -xf elasticsearch-0.90.5.tar.gz
RUN rm elasticsearch-0.90.5.tar.gz
RUN elasticsearch-0.90.5/bin/plugin -install mobz/elasticsearch-head
 
EXPOSE :9200
 
CMD elasticsearch-0.90.5/bin/elasticsearch -f

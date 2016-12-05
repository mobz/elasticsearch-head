#!/bin/bash
sed -i "s/localhost/0.0.0.0/g" /opt/head/Gruntfile.js
cd /opt/head
grunt server

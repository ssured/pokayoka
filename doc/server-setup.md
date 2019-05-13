# Couchdb

Set a longer timeout for cookie authentication, 86400 = 60 \* 60 \* 24 = one day

[couch_httpd_auth]
timeout = 86400
auth_cache_size = 500

# Node op server

https://medium.freecodecamp.org/you-should-never-ever-run-directly-against-node-js-in-production-maybe-7fdfaed51ec6
https://nodesource.com/blog/running-your-node-js-app-with-systemd-part-1/

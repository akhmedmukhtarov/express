
const http = require('http');
const fs = require('fs');
const path = require('path');

function express() {
  const app = {
    middleware: [],
    routes: {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {},
    },
  };

  app.use = function(middleware) {
    this.middleware.push(middleware);
  };

  app.get = function(path, handler) {
    this.routes.GET[path] = handler;
  };

  app.post = function(path, handler) {
    this.routes.POST[path] = handler;
  };

  app.put = function(path, handler) {
    this.routes.PUT[path] = handler;
  };

  app.delete = function(path, handler) {
    this.routes.DELETE[path] = handler;
  };

  app.listen = function(PORT, callback) {
    const server = http.createServer(async (req, res) => {
      for (let middleware of this.middleware) {
        middleware(req, res);
      }

      // Route the request to the appropriate handler
      const method = req.method;
      const url = req.url;
      const routeHandler = this.routes[method][url];
      if (routeHandler) {
        // Define response methods in the response object
        res.json = function(data) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify(data));
        };

        res.send = function(data) {
          if (typeof data === 'object') {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } else {
            res.setHeader('Content-Type', 'text/plain');
            res.statusCode = 200;
            res.end(data);
          }
        };

        res.sendFile = function(filePath) {
          const resolvedPath = path.resolve(filePath);
          fs.readFile(resolvedPath, function(err, data) {
            if (err) {
              res.statusCode = 500;
              res.end('Server error');
            } else {
              res.setHeader('Content-Type', 'text/plain');
              res.statusCode = 200;
              res.end(data);
            }
          });
        };

        // Extract req.body, req.headers, and req.params
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', () => {
          req.body = JSON.parse(body);
          req.headers = req.headers;
          req.params = url.split('/').slice(1);

          // Call the route handler function with the modified response object
          routeHandler(req, res);
        });
      } else {
        res.statusCode = 404;
        res.end('Not found');
      }
    });

    server.listen(PORT, callback);
  };

 return app;
}

module.exports = express;
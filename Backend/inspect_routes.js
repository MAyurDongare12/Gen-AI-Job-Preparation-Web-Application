const app = require('./src/app');

function listRoutes(stack, prefix = '') {
  stack.forEach((middleware) => {
    if (middleware.route) {
        // Simple route
        const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
        console.log(`${methods} ${prefix}${middleware.route.path}`);
    } else if (middleware.name === 'router') {
        // Router middleware
        const newPrefix = prefix + (middleware.regexp.source.replace('\\/', '/').replace('^', '').replace('\\/?(?=\\/|$)', ''));
        listRoutes(middleware.handle.stack, newPrefix);
    }
  });
}

listRoutes(app._logic_stack || app._router.stack);

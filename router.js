var router = new require('routes').Router();

module.exports = router;

var _static = require('./routes/static');
router.addRoute('/', _static);
router.addRoute('/static/*', _static);

router.addRoute('/cache/*', require('./routes/cache'));
router.addRoute('/api/:type?/:filter?/:new?', require('./routes/api'));

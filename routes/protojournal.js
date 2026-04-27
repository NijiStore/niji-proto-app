const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/protojournalController');

router.get('/prototypes', ctrl.getAll);
router.post('/prototypes', ctrl.create);
router.patch('/prototypes/:id', ctrl.update);
router.delete('/prototypes/:id', ctrl.remove);

module.exports = router;
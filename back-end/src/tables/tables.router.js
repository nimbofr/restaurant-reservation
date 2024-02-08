/**
 * Defines the router for reservation resources.
 *
 * @type {Router}
 */

const router = require("express").Router();
const tablesController = require("./tables.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

router
   .route("/:table_id/seat")
   .put(tablesController.update)
   .delete(tablesController.delete)
   .all(methodNotAllowed);

router
    .route("/")
    .get(tablesController.list)
    .post(tablesController.create)
    .all(methodNotAllowed)


module.exports = router;
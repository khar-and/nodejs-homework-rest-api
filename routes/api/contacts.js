const express = require("express");
const ctrl = require("../../controllers/contacts");

const { validateBody, isValidId, authenticate } = require("../../midlewares");

const { schemas } = require("../../models/contact");

const router = express.Router();

router.get("/", authenticate, ctrl.getAllContacts);
router.get("/:id", authenticate, isValidId, ctrl.getById);
router.post(
  "/",
  authenticate,
  validateBody(schemas.addSchema),
  ctrl.addContact
);
router.delete("/:contactId", authenticate, isValidId, ctrl.deleteContact);
router.put(
  "/:contactId",
  authenticate,
  isValidId,
  validateBody(schemas.addSchema),
  ctrl.updateContact
);
router.patch(
  "/:contactId/favorite",
  authenticate,
  isValidId,
  validateBody(schemas.updateFavoriteSchema),
  ctrl.updateStatusContact
);

module.exports = router;

import express from "express";
import { getPersonWithWorks} from "../controllers/personController.js";

const router = express.Router();

router.get("/:person_id/details", getPersonWithWorks);

export default router;

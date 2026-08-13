import { Router } from "express";
import {
  initiateUserOAuthController,
  handleOAuthCallbackController,
} from "../../adapters/http/controllers/oauth/oauthController";

const router = Router();

router.get("/authorize", initiateUserOAuthController);
router.get("/callback", handleOAuthCallbackController);

export default router;

import { Router } from "express";
import {
  initiateUserOAuthController,
  handleOAuthCallbackController,
  createTestOAuthCompanyController,
} from "../../adapters/http/controllers/oauth/oauthController";

const router = Router();

router.post("/test-seed", createTestOAuthCompanyController);
router.get("/authorize", initiateUserOAuthController);
router.get("/callback", handleOAuthCallbackController);

export default router;

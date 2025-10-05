import express from "express";
import {
    registerCustomer,
    createStaffMember,
    loginUser,
    logoutUser,
    refreshToken,
    getAllUsers,
    getUsersByRole,
    getUserById,
    updateUserProfile,
    adminUpdateUser,
    deleteUser,
    toggleUserStatus,
    getCurrentUserProfile,
    deleteOwnAccount,
    adminResendVerificationEmail,
    publicListDoctors,
    publicGetDoctorById
} from "../controllers/userController.js";
import { verifyEmail } from "../controllers/userController.js";
import { resendVerificationEmail } from "../controllers/userController.js";
import { googleSignin } from "../controllers/socialController.js";
import {
    authenticateToken,
    requireAdmin,
    requireOwnershipOrAdmin
} from "../middleware/auth.js";
import { validateRequest } from "../validation/validator.js";
import { loginSchema, registerSchema, createStaffSchema, updateProfileSchema, adminUpdateUserSchema, requestResetSchema, resetPasswordSchema, changePasswordSchema } from "../validation/userSchemas.js";

const router = express.Router();

// Public routes (no authentication required)
router.post("/register", validateRequest(registerSchema), registerCustomer);
router.post("/login", validateRequest(loginSchema), loginUser);
router.post("/logout", logoutUser);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/auth/google", googleSignin);
router.post("/forgot-password", validateRequest(requestResetSchema), requestPasswordReset);
router.post("/reset-password", validateRequest(resetPasswordSchema), resetPassword);
// Public doctors endpoints
router.get("/public/doctors", publicListDoctors);
router.get("/public/doctors/:id", publicGetDoctorById);

// Protected routes (authentication required)
router.use(authenticateToken);
router.post("/change-password", validateRequest(changePasswordSchema), (req, res, next) => next());
// changePassword must have access to req.userId; append handler
import { changePassword, requestPasswordReset, resetPassword } from "../controllers/userController.js";
router.post("/change-password", changePassword);


// Token management
router.post("/refresh", refreshToken);

// User profile management
router.get("/profile", getCurrentUserProfile);
router.put("/profile/:id", requireOwnershipOrAdmin, validateRequest(updateProfileSchema), updateUserProfile);
router.delete("/delete-account", deleteOwnAccount);

// Admin only routes
router.post("/staff", requireAdmin, validateRequest(createStaffSchema), createStaffMember);
router.get("/all", requireAdmin, getAllUsers);
router.get("/role/:role", requireAdmin, getUsersByRole);
router.get("/:id", requireAdmin, getUserById);
router.put("/:id", requireAdmin, validateRequest(adminUpdateUserSchema), adminUpdateUser);
router.delete("/:id", requireAdmin, deleteUser);
router.patch("/:id/toggle-status", requireAdmin, toggleUserStatus);
router.post("/:userId/resend-verification", requireAdmin, adminResendVerificationEmail);

export default router;



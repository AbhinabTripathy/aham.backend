const jwt = require('jsonwebtoken');
const { Creator } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');

const authMiddleware = {};

authMiddleware.checkAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.error(HttpStatus.UNAUTHORIZED, false, "No token provided");
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.APP_SUPER_SECRET_KEY);
            console.log("Decoded token:", decoded);

            let user;
            // Special handling for admin role since it's not stored in database
            if (decoded.role === 'admin') {
                // For admin, we don't need to fetch from database
                // Just use the decoded token information
                user = {
                    id: decoded.id,
                    username: decoded.username,
                    role: 'admin'
                };
            } else if (decoded.role === 'creator') {
                user = await Creator.findByPk(decoded.id);
                if (!user) {
                    return res.error(HttpStatus.UNAUTHORIZED, false, "Creator not found");
                }
                user.role = 'creator';
            } else {
                return res.error(HttpStatus.UNAUTHORIZED, false, "Invalid user role");
            }
            
            console.log("User found:", {
                id: user.id,
                role: user.role
            });

            req.user = user;
            next();
        } catch (error) {
            console.error("Token verification error:", error);
            return res.error(HttpStatus.UNAUTHORIZED, false, "Invalid token");
        }
    } catch (error) {
        console.error("Authentication error:", error);
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, "Authentication failed");
    }
};

authMiddleware.checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.error(HttpStatus.UNAUTHORIZED, false, "Authentication required");
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.error(HttpStatus.FORBIDDEN, false, "Access denied");
        }

        next();
    };
};

authMiddleware.isAdmin = (req, res, next) => {
    try {
        console.log("Checking admin privileges for user:", {
            id: req.user?.id,
            email: req.user?.email,
            role: req.user?.role
        });
        
        // Check if user is admin (accept both 'admin' and 'ADMIN')
        if (!req.user.role || (req.user.role !== 'admin' && req.user.role !== 'ADMIN')) {
            console.log("Access denied: User role is not admin");
            return res.error(
                HttpStatus.FORBIDDEN,
                "false",
                "Access denied. Admin privileges required.",
                []
            );
        }
        
        console.log("Admin access granted");
        next();
    } catch (error) {
        console.error("Error checking admin privileges:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Simplified auth middleware for creator routes
authMiddleware.creatorAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.error(HttpStatus.UNAUTHORIZED, false, "No token provided");
        }

        const token = authHeader.split(' ')[1];
        
        try {
            const decoded = jwt.verify(token, process.env.APP_SUPER_SECRET_KEY);
            
            // Verify the token is for a creator
            if (decoded.role !== 'creator') {
                return res.error(HttpStatus.FORBIDDEN, false, "Access denied. Creator privileges required.");
            }
            
            // Find the creator
            const creator = await Creator.findByPk(decoded.id);
            
            if (!creator) {
                return res.error(HttpStatus.UNAUTHORIZED, false, "Creator not found");
            }

            // Check if creator is active
            if (creator.status !== 'active') {
                return res.error(HttpStatus.FORBIDDEN, false, "Your account is not active");
            }

            req.user = creator;
            req.user.role = 'creator'; // Ensure role is available
            next();
        } catch (error) {
            console.error("Token verification error:", error);
            return res.error(HttpStatus.UNAUTHORIZED, false, "Invalid token");
        }
    } catch (error) {
        console.error("Authentication error:", error);
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, false, "Authentication failed");
    }
};

module.exports = authMiddleware;
import jwt from 'jsonwebtoken';

// Check if JWT secret exists
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET missing');
    process.exit(1);
}

// ✅ Authenticate user
export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Expect "Bearer TOKEN"
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token required' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // attach user info
        next();

    } catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// ✅ Role-based access
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};
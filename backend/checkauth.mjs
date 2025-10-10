import jwt from "jsonwebtoken";

const checkauth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, "this_secret_should_be_much_longer_and_in_env_variables");
        
        console.log("🔐 Token verified for user:", decoded.username);
        console.log("👤 User ID from token:", decoded.userId);
        
        req.userData = decoded;
        next();
    } catch(error) {
        console.error(" Token verification failed:", error.message);
        res.status(401).json({
            message: "token invalid"
        });
    }
};

export default checkauth;
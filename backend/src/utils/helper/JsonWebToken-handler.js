import jwt from 'jsonwebtoken';

const extractAuthenticatedUserId = (req) => {
  try {
    const token = req.cookies?.chatterbox;
    if (!token) return null;

    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    return id || null;
  } catch {
    return null;
  }
};

const generateAuthTokenAndSetCookie = (req, res, userId) => {

  // Clear the existing cookie if it exists
  if (req.cookies?.chatterbox) {
    res.clearCookie("chatterbox");
  }

  // Generate a new JWT token
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

  // Set the new cookie
  res.cookie("chatterbox", token, {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: "Lax", // Change from "strict" to allow cross-origin in dev
});

  // Log the generated token
  
  // Note: req.cookies.chatterbox will still be undefined here
};

const clearJwtCookie = (req, res) => {
  if (req.cookies?.chatterbox) {
    res.clearCookie('chatterbox');
  }
};

export {
  extractAuthenticatedUserId,
  generateAuthTokenAndSetCookie,
  clearJwtCookie,
};

import { v4 as uuidv4 } from "uuid";
export function aiSessionHandler(req, res, next) {
  // Check if session exists and has userData with userSession
  if (!req.session.userData || !req.session.userData.userSession) {
    // Create new session with UUID
    req.session.userData = {
      userSession: uuidv4(), // Generate unique session ID
      createdAt: new Date().toISOString(),
      visits: 0,
    };
    console.log(`New session created: ${req.session.userData.userSession}`);
  }
  // Note: Session expiration is handled automatically by maxAge
  next();
}

# Copilot Instructions for Backend Major Project

## Project Overview
This is a Node.js backend for a YouTube-like platform ("clonetube") using Express, MongoDB (via Mongoose), and Cloudinary for media storage. The codebase is modular, with clear separation of concerns for models, controllers, routes, middlewares, and utilities.

## Architecture & Data Flow
- **Entry Point:** `src/index.js` loads environment variables, connects to MongoDB, and starts the Express server.
- **App Setup:** `src/app.js` configures middleware (CORS, JSON parsing, static files, cookies) and mounts routers.
- **Routing:**
  - All user-related endpoints are under `/api/v1/users` (see `src/routes/user.routers.js`).
  - File uploads (avatar, coverImage) use Multer and are stored on Cloudinary.
- **Models:**
  - `user.model.js`: User schema with authentication helpers (JWT, bcrypt), avatar/cover image URLs, and watch history.
  - `video.model.js`: Video schema with Cloudinary URLs, owner reference, and aggregate pagination.
  - `subscription.model.js`: Tracks user subscriptions (subscriber/channel relationship).
- **Controllers:**
  - `user.controller.js`: Handles registration, login, logout, token refresh, and user logic. Uses async handler and custom error/response utilities.
- **Middlewares:**
  - `auth.middleware.js`: JWT-based authentication, attaches user to request.
  - `multer.middleware.js`: Handles file uploads for user registration.
- **Utilities:**
  - `ApiError.js`, `ApiResponse.js`, `asyncHandler.js`, `cloudinary.js`: Standardized error handling, responses, async wrappers, and Cloudinary integration.

## Developer Workflows
- **Run in Development:**
  - Use `npm run dev` (nodemon runs `src/index.js`).
- **Environment Variables:**
  - Required: `MONGODB_URI`, `ACCESS_TOKEN_SECRET`, `CORS_ORIGIN`, `PORT` (see `.env` and `src/constants.js`).
- **Database:**
  - MongoDB database name is set in `src/constants.js` as `clonetube`.
- **Testing/Debugging:**
  - No explicit test scripts; use Postman or similar tools for API testing.
  - Console logs are used for DB connection and server status.

## Project-Specific Patterns & Conventions
- **Async/Await:** All controller logic uses async/await with a custom `asyncHandler` for error propagation.
- **Error Handling:** Use `ApiError` for throwing errors and `ApiResponse` for standardized responses.
- **Authentication:** JWT tokens are stored in cookies (`accessToken`), verified in `auth.middleware.js`.
- **File Uploads:** Multer middleware expects `avatar` and `coverImage` fields for user registration.
- **Cloudinary:** All media files (avatars, videos, thumbnails) are stored on Cloudinary; URLs are saved in the database.
- **Pagination:** Video model uses `mongoose-aggregate-paginate-v2` for paginated queries.
- **Naming:** Models, controllers, and routes follow singular/plural and camelCase conventions (e.g., `user.model.js`, `userRouters`).

## Key Files & Directories
- `src/index.js`, `src/app.js`: Server setup and middleware configuration
- `src/routes/user.routers.js`: User API endpoints
- `src/controller/user.controller.js`: User logic
- `src/models/`: Mongoose schemas for User, Video, Subscription
- `src/middlewares/`: Auth and file upload middlewares
- `src/utils/`: Error, response, async, and Cloudinary helpers

## Integration Points
- **External Services:**
  - Cloudinary for media storage
  - MongoDB for data persistence
- **Dependencies:**
  - Express, Mongoose, Multer, Cloudinary, JWT, bcrypt, cookie-parser, cors

---

**For AI agents:**
- Always use the provided error/response utilities for consistency.
- Follow the async/await pattern with `asyncHandler`.
- Respect the modular structure—add new features in the appropriate directory.
- Reference the above files for examples of project conventions.

---

_If any section is unclear or missing, please provide feedback for further refinement._

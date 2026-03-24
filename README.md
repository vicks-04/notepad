# Cloud Notepad

Cloud Notepad is a production-ready MERN note-taking application with:

- JWT authentication with hashed passwords using bcrypt
- CRUD notes scoped to each authenticated user
- MongoDB full-text search across note title and content
- Note version history with restore support
- React frontend with plain CSS, responsive layout, loading states, and debounced search
- Pagination for large note collections and optimized MongoDB indexing for scale

## Tech Stack

- Frontend: React + Vite + plain CSS
- Backend: Node.js + Express.js
- Database: MongoDB Atlas with Mongoose
- Authentication: JWT + bcrypt

## Core Features

- Register, login, logout, and protected frontend routes
- Create, read, update, and delete notes per authenticated user
- Full-text search over title and content using MongoDB text indexes
- Version history snapshots on each note update
- Restore any historical note version
- Favorites and pinned notes with top-of-list sorting
- Tagging, tag filtering, archive state, trash recovery, and permanent delete
- Public read-only note sharing with unique share tokens
- Google Tasks-style task management with today/upcoming/completed views
- Inline task editing, autosave, due dates, priorities, and overdue highlighting
- Note-linked tasks shown directly inside the note editor
- Activity logging, autosave, dark mode, sidebar sections, and responsive layout
- Debounced search, pagination, loading states, and API error handling

## Project Structure

```text
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
frontend/
  src/
    components/
    context/
    hooks/
    lib/
    pages/
    styles/
```

## Daily Task Implementation

### Day 1

- Set up the Express server in `backend/server.js`
- Added MongoDB connection logic in `backend/config/db.js`
- Created the base backend folder structure for config, models, routes, controllers, and middleware

### Day 2

- Implemented user registration and login in `backend/controllers/authController.js`
- Added bcrypt password hashing and JWT token generation
- Added route protection middleware in `backend/middleware/authMiddleware.js`

### Day 3

- Built notes CRUD endpoints in `backend/controllers/noteController.js`
- Added user-scoped note ownership in `backend/models/Note.js`
- Created RESTful routes under `/api/notes`

### Day 4

- Added version history with a dedicated `NoteVersion` collection
- Stored previous note snapshots on update and restore
- Added history listing and version restore endpoints

### Day 5

- Added MongoDB full-text indexing on note `title` and `content`
- Added user-scoped sorting indexes for `updatedAt` and `createdAt`
- Implemented paginated search queries for fast retrieval at scale

### Day 6

- Built the React UI for authentication, dashboard, and note editor
- Added responsive plain CSS styles without Tailwind, Bootstrap, or UI libraries
- Added sidebar navigation, search bar, and version history UI

### Day 7

- Connected the React frontend to the Express API
- Added auth persistence, loading states, and error handling
- Finalized debounced search, note pagination, favicon support, and router configuration

## Setup

### 1. Install dependencies

From the project root:

```bash
npm install
npm run install-all
```

Or install each app separately:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/cloud-notepad?retryWrites=true&w=majority
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Notes:

- Replace `<username>`, `<password>`, and `<cluster-url>` with your MongoDB Atlas values.
- If your password contains special characters such as `@`, `:`, `/`, `?`, or `#`, URL-encode it before putting it into `MONGO_URI`.
- You can also use a local MongoDB URI during development if preferred.

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the app

Use the root convenience script:

```bash
npm run dev
```

Or run both apps separately:

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

### 4. Production build

Build the frontend for production:

```bash
cd frontend && npm run build
```

Start the backend API:

```bash
cd backend && npm run start
```

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Notes

- `GET /api/notes`
- `POST /api/notes`
- `POST /api/notes/pin/:noteId`
- `GET /api/notes/:noteId`
- `PUT /api/notes/:noteId`
- `DELETE /api/notes/:noteId`
- `POST /api/notes/:noteId/archive`
- `POST /api/notes/:noteId/archive/restore`
- `POST /api/notes/:noteId/trash/restore`
- `DELETE /api/notes/:noteId/permanent`
- `POST /api/notes/:noteId/share`
- `GET /api/notes/:noteId/activity`
- `GET /api/notes/:noteId/history`
- `POST /api/notes/:noteId/versions/:versionId/restore`
- `GET /api/notes/shared/:shareToken`

### Tasks

- `POST /api/tasks/create`
- `GET /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `PATCH /api/tasks/:id/toggle`

## Search and Scalability Notes

- Notes use a compound text index on `user`, `title`, and `content`.
- Separate indexes support fast user-scoped sorting by `updatedAt` and `createdAt`.
- Additional indexes support pinned sorting, tag filtering, trash/archive filtering, and public share tokens.
- Tasks use indexes on `userId`, `dueDate`, `completed`, `noteId`, and `order`.
- Version history is stored in a separate `NoteVersion` collection so note documents stay small and efficient even with heavy editing.
- Notes list queries are paginated to support large note collections, including 1000+ active notes per user.
- The frontend uses debounced search input to reduce unnecessary API calls during typing.
- Task filters support all tasks, today, upcoming, completed, and optional note-linked queries.

## Verification

- Frontend production build passes with `npm run build` in `frontend/`
- Backend module loading passes locally
- Running the full app requires a valid MongoDB Atlas connection string in `backend/.env`

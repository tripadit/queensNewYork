# Diamond Store Video Analytics

This project is a real-time video analytics platform for a diamond store. It uses computer vision to detect people, track their visits, and provide analytics on customer traffic.

## Architecture

The application is composed of a Python backend and a React frontend.

### Backend

The backend is built with FastAPI and uses the following technologies:

- **FastAPI:** For the web framework.
- **YOLOv8:** For object detection.
- **DeepSort:** For object tracking.
- **InsightFace:** For face recognition.
- **PostgreSQL with pgvector:** For storing data and vector embeddings.
- **SQLAlchemy:** For the ORM.

### Frontend

The frontend is a React application that provides a dashboard to visualize the video stream and analytics. It uses:

- **React:** For the UI library.
- **Material-UI:** For UI components.
- **Recharts:** For charts.
- **Axios:** For making API requests.

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js and npm
- PostgreSQL server

### Backend Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up the database:**
   - Make sure your PostgreSQL server is running.
   - Set the `DATABASE_URL` environment variable in `app/core/config.py` to point to your PostgreSQL database.
   - Run the `create_tables.py` script once to create the necessary tables:
     ```bash
     python create_tables.py
     ```

3. **Run the backend server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   **Important:** After installing, you may see a message about vulnerabilities. Please **do not** run `npm audit fix --force`, as it can break the `react-scripts` installation. The standard `npm audit fix` is acceptable, but the forced version is known to cause issues.

3. **Start the frontend development server:**
   ```bash
   npm start
   ```

After completing these steps, you can open a web browser and navigate to `http://localhost:3000` to see the application.

---

## Production Deployment

### Frontend

To create a production-ready build of the frontend, run the following command in the `frontend` directory:

```bash
npm run build
```

This will create a `build` directory with optimized static assets. You can serve this directory using a static file server. A simple one to use is `serve`:

```bash
# Install serve globally if you don't have it
npm install -g serve

# Serve the build directory
serve -s build
```

This will typically make the production application available at `http://localhost:3000`.

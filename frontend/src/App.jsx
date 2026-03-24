import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import NotFoundPage from "./pages/NotFoundPage";
import SharedNotePage from "./pages/SharedNotePage";
import Tasks from "./pages/Tasks";

export default function App() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/shared/:shareToken" element={<SharedNotePage />} />
      <Route path="/auth" element={token ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:taskSection" element={<Tasks />} />
        <Route path="/notes/:noteId" element={<Notes />} />
      </Route>
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to={token ? "/404" : "/auth"} replace />} />
    </Routes>
  );
}

import { Navigate, Outlet } from "react-router-dom";

// The session (token + expiry) is persisted in localStorage by the login page,
// so a page reload keeps the user logged in while the token is still valid.
const hasValidToken = (): boolean => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  const expiresAt = localStorage.getItem("expiresAt");
  if (expiresAt) {
    const expiry = new Date(expiresAt);
    // Only treat it as expired when the stored date is actually parseable.
    if (!isNaN(expiry.getTime()) && expiry < new Date()) return false;
  }

  return true;
};

// Wraps protected routes: unauthenticated visitors are sent to the login page.
const RequireAuth = () => {
  if (!hasValidToken()) return <Navigate to="/" replace />;
  return <Outlet />;
};

// Wraps the login page: logged-in users skip it and land on the dashboard.
const RedirectIfAuthed = () => {
  if (hasValidToken()) return <Navigate to="/index" replace />;
  return <Outlet />;
};

export { RequireAuth, RedirectIfAuthed };

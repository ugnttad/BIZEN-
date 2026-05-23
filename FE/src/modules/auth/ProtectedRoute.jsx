import { Navigate, useLocation } from "react-router-dom";
import { getAuthUser, getDefaultPathForRole } from "./authStore";

export default function ProtectedRoute({ roles, children }) {
  const location = useLocation();
  const user = getAuthUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

  return children;
}

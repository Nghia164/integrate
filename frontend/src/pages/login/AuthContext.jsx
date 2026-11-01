// Re-export AuthContext từ src/context/AuthContext.jsx
import AuthContext, { useAuth, AuthProvider, validateStoredUser } from "../../context/AuthContext";

export { useAuth, AuthProvider, validateStoredUser };
export default AuthContext;

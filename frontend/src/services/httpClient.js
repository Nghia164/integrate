import axios from "axios";

const httpClient = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || "http://localhost:8000/api",
});

// Gắn JWT vào mỗi request (ưu tiên sessionStorage của tab hiện tại)
httpClient.interceptors.request.use((config) => {
  const token =
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
    (typeof localStorage !== "undefined" && localStorage.getItem("token"));
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Hết hạn token -> về trang đăng nhập
httpClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      }
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default httpClient;

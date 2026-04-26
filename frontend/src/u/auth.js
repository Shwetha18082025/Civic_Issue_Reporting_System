export const getToken = () => localStorage.getItem("civic_token");
export const getRole  = () => localStorage.getItem("civic_role");
export const getUser  = () => JSON.parse(localStorage.getItem("civic_user") || "{}");
export const isLoggedIn = () => !!getToken();
export const logout   = () => {
  localStorage.removeItem("civic_token");
  localStorage.removeItem("civic_role");
  localStorage.removeItem("civic_user");
};
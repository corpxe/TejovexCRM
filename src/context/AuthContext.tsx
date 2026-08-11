import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import { getProfile } from "../api/auth.api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getProfile()
        .then((res) => {
          const userData =
            res.data?.data?.user ??
            res.data?.data ??
            res.data?.user ??
            res.data;
          setUser(userData);
        })
        .catch((err) => {
          console.log("getProfile error:", err.response?.status, err.response?.data);
          // Don't clear token — keep user logged in even if profile fails
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}














// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { loginUser, registerUser } from "../../api/auth.api";
// import { useAuth } from "../../context/AuthContext";

// const loginSchema = z.object({
//   email:    z.string().email("Invalid email"),
//   password: z.string().min(6, "Minimum 6 characters"),
// });

// const registerSchema = z.object({
//   firstName: z.string().min(1, "Required"),
//   lastName:  z.string().min(1, "Required"),
//   email:     z.string().email("Invalid email"),
//   password:  z.string().min(6, "Minimum 6 characters"),
//   phone:     z.string().min(10, "Phone number is required"),
//   role:      z.enum(["ADMIN", "USER"], { required_error: "Please select a role" }),
// });

// type LoginForm    = z.infer<typeof loginSchema>;
// type RegisterForm = z.infer<typeof registerSchema>;

// function Field({
//   label, error, children,
// }: {
//   label: string;
//   error?: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="flex flex-col gap-1">
//       <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
//         {label}
//       </label>
//       {children}
//       {error && <p className="text-xs text-red-500">{error}</p>}
//     </div>
//   );
// }

// const inputCls =
//   "rounded-lg bg-gray-100 px-3 py-2.5 text-sm outline-none ring-1 ring-gray-200 " +
//   "focus:ring-yellow-500 placeholder:text-gray-400 transition-all";

// // ─── Login Form ───
// function LoginForm() {
//   const { login } = useAuth();
//   const navigate  = useNavigate();
//   const [serverError, setServerError] = useState("");

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

//   const onSubmit = async (data: LoginForm) => {
//     try {
//       setServerError("");
//       const res = await loginUser(data);
//       const token = res.data?.data?.token ?? res.data?.token;

//       if (!token) {
//         setServerError("Login failed — no token received");
//         return;
//       }

//       // login(token) → triggers getProfile() in AuthContext useEffect
//       login(token);

//       // Wait for profile to load, then route by role
//       // (short delay to let getProfile() finish)
//       setTimeout(() => navigate("/dashboard"), 100);
//     } catch (err: any) {
//       setServerError(err.response?.data?.message ?? "Login failed");
//     }
//   };

//   return (
//     <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
//       <h2 className="mb-5 text-lg font-semibold text-gray-800">Login</h2>

//       <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
//         <Field label="Email" error={errors.email?.message}>
//           <input
//             {...register("email")}
//             placeholder="Enter your email"
//             className={inputCls}
//           />
//         </Field>

//         <Field label="Password" error={errors.password?.message}>
//           <input
//             {...register("password")}
//             type="password"
//             placeholder="Enter your password"
//             className={inputCls}
//           />
//         </Field>

//         {serverError && (
//           <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
//             {serverError}
//           </p>
//         )}

//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="mt-1 rounded-lg bg-yellow-600 py-2.5 text-sm font-semibold
//                      text-white hover:bg-yellow-700 disabled:opacity-60 transition-colors"
//         >
//           {isSubmitting ? "Logging in…" : "Login →"}
//         </button>
//       </form>
//     </div>
//   );
// }

// // ─── Register Form ───
// function RegisterForm() {
//   const [serverError, setServerError] = useState("");
//   const [successMsg,  setSuccessMsg]  = useState("");

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

//   const onSubmit = async (data: RegisterForm) => {
//     try {
//       setServerError("");
//       await registerUser(data);
//       setSuccessMsg("Account created! You can now log in.");
//       reset();
//     } catch (err: any) {
//       setServerError(err.response?.data?.message ?? "Registration failed");
//     }
//   };

//   return (
//     <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
//       <h2 className="mb-5 text-lg font-semibold text-gray-800">Register</h2>

//       <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
//         <div className="grid grid-cols-2 gap-3">
//           <Field label="First Name" error={errors.firstName?.message}>
//             <input
//               {...register("firstName")}
//               placeholder="Enter first name"
//               className={inputCls}
//             />
//           </Field>
//           <Field label="Last Name" error={errors.lastName?.message}>
//             <input
//               {...register("lastName")}
//               placeholder="Enter last name"
//               className={inputCls}
//             />
//           </Field>
//         </div>

//         <Field label="Email" error={errors.email?.message}>
//           <input
//             {...register("email")}
//             placeholder="Enter email address"
//             className={inputCls}
//           />
//         </Field>

//         <Field label="Password" error={errors.password?.message}>
//           <input
//             {...register("password")}
//             type="password"
//             placeholder="Enter password"
//             className={inputCls}
//           />
//         </Field>

//         <Field label="Phone *" error={errors.phone?.message}>
//           <input
//             {...register("phone")}
//             placeholder="Enter phone number"
//             className={inputCls}
//           />
//         </Field>

//         <Field label="Role *" error={errors.role?.message}>
//           <select
//             {...register("role")}
//             className={inputCls}
//             defaultValue=""
//           >
//             <option value="" disabled>Select a role</option>
//             <option value="ADMIN">Admin</option>
//             <option value="USER">User</option>
//           </select>
//         </Field>

//         {serverError && (
//           <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
//             {serverError}
//           </p>
//         )}
//         {successMsg && (
//           <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
//             {successMsg}
//           </p>
//         )}

//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="mt-1 rounded-lg border border-yellow-600 py-2.5 text-sm
//                      font-semibold text-yellow-700 hover:bg-yellow-50
//                      disabled:opacity-60 transition-colors"
//         >
//           {isSubmitting ? "Registering…" : "Register Account"}
//         </button>
//       </form>
//     </div>
//   );
// }

// // ─── Page shell ───
// export default function AuthPage() {
//   return (
//     <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
//       <div className="w-full max-w-4xl">
//         <div className="mb-6 text-center">
//           <h1 className="text-2xl font-bold text-gray-800">Tejovex CRM</h1>
//           <p className="mt-1 text-sm text-gray-500">
//             Welcome back! Please login or create an account.
//           </p>
//         </div>
//         <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//           <RegisterForm />
//           <LoginForm />
//         </div>
//       </div>
//     </div>
//   );
// }
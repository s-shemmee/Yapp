import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Login.scss";
import { APP_NAME } from "../constants";
import { auth, db } from "../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import {
  MailOutlineRounded as MailOutlineRoundedIcon,
  HttpsOutlined as HttpsOutlinedIcon,
  VisibilityOffOutlined as VisibilityOffOutlinedIcon,
  RemoveRedEyeOutlined as RemoveRedEyeOutlinedIcon,
} from "@mui/icons-material";
import Checkbox from "@mui/material/Checkbox";
import { Typography } from "@mui/material";
import LoadingScreen from "../components/LoadingScreen";

const PRIMARY = "#9474f4";

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact support if you think this is a mistake.";
      default:
        return "Invalid email or password. Please try again.";
    }
  }
  return "Something went wrong. Please try again.";
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    },
    []
  );

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;
      setErrorMessage(null);

      const { email, password, rememberMe } = formData;

      if (!email || !password) {
        setErrorMessage("Please enter both email and password.");
        return;
      }

      try {
        setLoading(true);

        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        );

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        const usersDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(usersDocRef);

        if (userDoc.exists()) {
          await updateDoc(usersDocRef, {
            userMetadata: {
              creationTime: user.metadata.creationTime,
              lastSignInTime: user.metadata.lastSignInTime,
            },
          });
        } else {
          console.error("User document does not exist:", user.uid);
        }

        navigate("/");
      } catch (error: unknown) {
        setErrorMessage(getLoginErrorMessage(error));
        setLoading(false);
      }
    },
    [formData, navigate, loading]
  );

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="loginForm">
      <div className="logo">
        <h1>
          {APP_NAME.charAt(0)}
          <span>{APP_NAME.slice(1)}</span>
        </h1>
        <img src={logo} alt={`${APP_NAME} logo`} />
      </div>
      <div className="heading">
        <h3>
          Welcome back! Please <span>sign in</span> to your account.
        </h3>
      </div>
      <form onSubmit={handleLogin} noValidate>
        <div className="formGroup">
          <label htmlFor="email">Email</label>
          <div className="inputGroup">
            <MailOutlineRoundedIcon className="inputIcon" aria-hidden="true" />
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={formData.email}
              required
              aria-describedby={errorMessage ? "login-error" : undefined}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="formGroup">
          <label htmlFor="password">Password</label>
          <div className="inputGroup">
            <HttpsOutlinedIcon className="inputIcon" aria-hidden="true" />
            <input
              type={isPasswordVisible ? "text" : "password"}
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="********"
              value={formData.password}
              required
              aria-describedby={errorMessage ? "login-error" : undefined}
              onChange={handleInputChange}
            />
            <button
              type="button"
              className="show_hide"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              onClick={togglePasswordVisibility}
            >
              {isPasswordVisible ? (
                <VisibilityOffOutlinedIcon className="inputIcon" aria-hidden="true" />
              ) : (
                <RemoveRedEyeOutlinedIcon className="inputIcon" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="remember_forget">
          <div className="remember">
            <Checkbox
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              inputProps={{ "aria-label": "Remember me" }}
              sx={{
                color: PRIMARY,
                "&.Mui-checked": { color: PRIMARY },
              }}
            />
            <label htmlFor="rememberMe">Remember me</label>
          </div>
          <Link to="/forgot-password" className="forget">
            Forgot password?
          </Link>
        </div>

        {errorMessage && (
          <div className="error-message" id="login-error" role="alert" aria-live="polite">
            <Typography color="error">{errorMessage}</Typography>
          </div>
        )}

        <button className="formButton" type="submit" disabled={loading}>
          Sign in
        </button>

        <span>
          Don&rsquo;t have an account yet? <Link to="/register">Sign up</Link>
        </span>
      </form>
    </div>
  );
};

export default Login;

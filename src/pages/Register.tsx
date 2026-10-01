import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Register.scss";
import { APP_NAME } from "../constants";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, setDoc } from "firebase/firestore";
import {
  AccountCircleOutlined as AccountCircleOutlinedIcon,
  MailOutlineRounded as MailOutlineRoundedIcon,
  HttpsOutlined as HttpsOutlinedIcon,
  VisibilityOffOutlined as VisibilityOffOutlinedIcon,
  RemoveRedEyeOutlined as RemoveRedEyeOutlinedIcon,
  AddPhotoAlternateRounded as AddPhotoAlternateRoundedIcon,
  WorkOutlineRounded as WorkOutlineRoundedIcon,
} from "@mui/icons-material";
import LoadingScreen from "../components/LoadingScreen";
import { Typography } from "@mui/material";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/gif"];
const MAX_TEXT_FIELD_LENGTH = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

type FieldName = "displayName" | "profession" | "email" | "password" | "avatar";
type FieldErrors = Partial<Record<FieldName, string>>;

interface FormState {
  displayName: string;
  profession: string;
  email: string;
  password: string;
}

const initialForm: FormState = {
  displayName: "",
  profession: "",
  email: "",
  password: "",
};

function getRegisterErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password is too weak. Use at least 6 characters.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return "Registration failed. Please try again.";
    }
  }
  if (error instanceof Error && error.message === "AVATAR_UPLOAD_FAILED") {
    return "We couldn't upload your avatar. Please try again.";
  }
  return "Registration failed. Please try again.";
}

function validateField(name: FieldName, form: FormState, avatar: File | null): string | undefined {
  switch (name) {
    case "displayName":
      if (!form.displayName.trim()) return "Display name is required.";
      if (form.displayName.length > MAX_TEXT_FIELD_LENGTH)
        return `Must be under ${MAX_TEXT_FIELD_LENGTH} characters.`;
      return undefined;
    case "profession":
      if (!form.profession.trim()) return "Profession is required.";
      if (form.profession.length > MAX_TEXT_FIELD_LENGTH)
        return `Must be under ${MAX_TEXT_FIELD_LENGTH} characters.`;
      return undefined;
    case "email":
      if (!form.email.trim()) return "Email is required.";
      if (!EMAIL_PATTERN.test(form.email)) return "Enter a valid email address.";
      return undefined;
    case "password":
      if (!form.password) return "Password is required.";
      if (form.password.length < 6) return "Use at least 6 characters.";
      return undefined;
    case "avatar":
      if (!avatar) return "Please choose an avatar image.";
      if (!ALLOWED_AVATAR_TYPES.includes(avatar.type))
        return "Use a JPG, PNG, or GIF file.";
      if (avatar.size > MAX_AVATAR_BYTES) return "Must be smaller than 5MB.";
      return undefined;
  }
}

// Uploads directly to Cloudinary from the browser using an unsigned
// preset. Returns the hosted image URL, or throws AVATAR_UPLOAD_FAILED.
async function uploadAvatar(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    console.error(
      "Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET"
    );
    throw new Error("AVATAR_UPLOAD_FAILED");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "yapp-avatars");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error("AVATAR_UPLOAD_FAILED");
  }

  const data = await response.json();
  return data.secure_url as string;
}

const Register: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);

  const runValidation = useCallback(
    (name: FieldName, nextForm: FormState, nextAvatar: File | null) => {
      const message = validateField(name, nextForm, nextAvatar);
      setFieldErrors((prev) => ({ ...prev, [name]: message }));
      return message;
    },
    []
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target as { name: FieldName; value: string };
      setForm((prev) => {
        const next = { ...prev, [name]: value };
        if (touched[name]) runValidation(name, next, avatar);
        return next;
      });
    },
    [touched, avatar, runValidation]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const name = e.target.name as FieldName;
      setTouched((prev) => ({ ...prev, [name]: true }));
      runValidation(name, form, avatar);
    },
    [form, avatar, runValidation]
  );

  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setAvatar(file);
      setTouched((prev) => ({ ...prev, avatar: true }));
      runValidation("avatar", form, file);

      setAvatarPreviewUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return file ? URL.createObjectURL(file) : null;
      });
    },
    [form, runValidation]
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;
      setFormError(null);

      const fields: FieldName[] = [
        "displayName",
        "profession",
        "email",
        "password",
        "avatar",
      ];
      const nextErrors: FieldErrors = {};
      fields.forEach((name) => {
        const message = validateField(name, form, avatar);
        if (message) nextErrors[name] = message;
      });
      setFieldErrors(nextErrors);
      setTouched({
        displayName: true,
        profession: true,
        email: true,
        password: true,
        avatar: true,
      });

      if (Object.keys(nextErrors).length > 0 || !avatar) {
        return;
      }

      let createdUser: User | null = null;

      try {
        setLoading(true);

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        createdUser = userCredential.user;

        const downloadURL = await uploadAvatar(avatar);

        await updateProfile(createdUser, {
          displayName: form.displayName.trim(),
          photoURL: downloadURL,
        });

        await setDoc(doc(db, "users", createdUser.uid), {
          uid: createdUser.uid,
          displayName: form.displayName.trim(),
          profession: form.profession.trim(),
          email: form.email,
          avatarURL: downloadURL,
          userMetadata: {
            creationTime: createdUser.metadata.creationTime,
            lastSignInTime: createdUser.metadata.lastSignInTime,
          },
        });

        await setDoc(doc(db, "userChats", createdUser.uid), {
          chatIdList: [],
        });

        navigate("/");
      } catch (error: unknown) {
        console.error("Registration failed:", error);
        setFormError(getRegisterErrorMessage(error));

        // If the auth account was created but a later step (avatar
        // upload, Firestore write) failed, don't leave an orphaned
        // account with no profile — remove it so the person can
        // cleanly retry.
        if (createdUser) {
          try {
            await deleteUser(createdUser);
          } catch (cleanupError) {
            console.error("Failed to clean up orphaned account:", cleanupError);
          }
        }

        setLoading(false);
      }
    },
    [form, avatar, navigate, loading]
  );

  if (loading) {
    return <LoadingScreen />;
  }

  const describedBy = (name: FieldName, hintId?: string) =>
    [hintId, fieldErrors[name] ? `${name}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="registerForm">
      <div className="logo">
        <h1>
          {APP_NAME.charAt(0)}
          <span>{APP_NAME.slice(1)}</span>
        </h1>
        <img src={logo} alt={`${APP_NAME} logo`} />
      </div>
      <div className="heading">
        <h3>
          <span>Sign up</span> to get started with {APP_NAME}!
        </h3>
      </div>
      <form onSubmit={handleRegister} noValidate>
        <div className="formRow">
          <div className={`formGroup${fieldErrors.displayName ? " hasError" : ""}`}>
            <label htmlFor="displayName">Display Name</label>
            <div className="inputGroup">
              <AccountCircleOutlinedIcon className="inputIcon" aria-hidden="true" />
              <input
                type="text"
                id="displayName"
                name="displayName"
                autoComplete="off"
                placeholder="Your Display Name"
                maxLength={MAX_TEXT_FIELD_LENGTH}
                value={form.displayName}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(fieldErrors.displayName)}
                aria-describedby={describedBy("displayName")}
              />
            </div>
            {fieldErrors.displayName && (
              <span className="fieldError" id="displayName-error" role="alert">
                {fieldErrors.displayName}
              </span>
            )}
          </div>

          <div className={`formGroup${fieldErrors.profession ? " hasError" : ""}`}>
            <label htmlFor="profession">Profession</label>
            <div className="inputGroup">
              <WorkOutlineRoundedIcon className="inputIcon" aria-hidden="true" />
              <input
                type="text"
                id="profession"
                name="profession"
                autoComplete="off"
                placeholder="Your Profession"
                maxLength={MAX_TEXT_FIELD_LENGTH}
                value={form.profession}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(fieldErrors.profession)}
                aria-describedby={describedBy("profession")}
              />
            </div>
            {fieldErrors.profession && (
              <span className="fieldError" id="profession-error" role="alert">
                {fieldErrors.profession}
              </span>
            )}
          </div>
        </div>

        <div className={`formGroup${fieldErrors.email ? " hasError" : ""}`}>
          <label htmlFor="email">Email</label>
          <div className="inputGroup">
            <MailOutlineRoundedIcon className="inputIcon" aria-hidden="true" />
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={describedBy("email")}
            />
          </div>
          {fieldErrors.email && (
            <span className="fieldError" id="email-error" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className={`formGroup${fieldErrors.password ? " hasError" : ""}`}>
          <label htmlFor="password">Password</label>
          <div className="inputGroup">
            <HttpsOutlinedIcon className="inputIcon" aria-hidden="true" />
            <input
              type={isPasswordVisible ? "text" : "password"}
              id="password"
              name="password"
              placeholder="********"
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={describedBy("password", "password-hint")}
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
          {fieldErrors.password ? (
            <span className="fieldError" id="password-error" role="alert">
              {fieldErrors.password}
            </span>
          ) : (
            <span id="password-hint" className="fieldHint">
              At least 6 characters.
            </span>
          )}
        </div>

        <div className={`formGroup${fieldErrors.avatar ? " hasError" : ""}`}>
          <label htmlFor="avatar">Avatar</label>
          <div className="avatarPicker">
            {avatarPreviewUrl ? (
              <img src={avatarPreviewUrl} alt="" className="avatarPreview" />
            ) : (
              <span className="avatarPreview avatarPreview--empty" aria-hidden="true">
                <AddPhotoAlternateRoundedIcon />
              </span>
            )}
            <div className="avatarPickerControls">
              <button
                type="button"
                className="avatarPickerButton"
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatar ? "Change image" : "Choose image"}
              </button>
              {avatar && (
                <span className="avatarFileName">{avatar.name}</span>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                id="avatar"
                name="avatar"
                className="visuallyHidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleAvatarChange}
                aria-describedby={describedBy("avatar", "avatar-hint")}
              />
            </div>
          </div>
          {fieldErrors.avatar ? (
            <span className="fieldError" id="avatar-error" role="alert">
              {fieldErrors.avatar}
            </span>
          ) : (
            <span id="avatar-hint" className="fieldHint">
              JPG, PNG, or GIF, up to 5MB.
            </span>
          )}
        </div>

        {formError && (
          <div className="error-message" id="register-error" role="alert" aria-live="polite">
            <Typography color="error">{formError}</Typography>
          </div>
        )}

        <button className="formButton" type="submit" disabled={loading}>
          Sign up
        </button>

        <span>
          Already have an account? <Link to="/login">Sign in</Link>
        </span>
      </form>
    </div>
  );
};

export default Register;

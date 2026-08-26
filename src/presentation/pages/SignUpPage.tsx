import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@application/context/AuthContext";

export function SignUpPage() {
  const { t } = useTranslation();
  const { signUp, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await signUp(email, password);
    setVerificationSent(result.verificationSent);
  }

  if (verificationSent) {
    return (
      <div className="container">
        <p>{t("auth.verificationSent")}</p>
      </div>
    );
  }

  return (
    <form className="container" onSubmit={handleSubmit}>
      <h1>{t("auth.createAccount")}</h1>
      <label>
        {t("auth.email")}
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        {t("auth.password")}
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && (
        <p role="alert" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={loading}>
        {t("auth.createAccount")}
      </button>
    </form>
  );
}

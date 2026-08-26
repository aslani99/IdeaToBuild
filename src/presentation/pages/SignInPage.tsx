import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@application/context/AuthContext";

export function SignInPage() {
  const { t } = useTranslation();
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await signIn(email, password);
  }

  return (
    <form className="container" onSubmit={handleSubmit}>
      <h1>{t("auth.signIn")}</h1>
      <label>
        {t("auth.email")}
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        {t("auth.password")}
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && (
        <p role="alert" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={loading}>
        {t("auth.signIn")}
      </button>
    </form>
  );
}

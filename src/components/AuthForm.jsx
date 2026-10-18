import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AUTH_URL } from "../constants";

function AuthForm({ mode, onAuthenticated }) {
    const isRegister = mode === "register";
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);

    const update = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: "", form: "" }));
    };

    const submit = async (event) => {
        event.preventDefault();
        const normalized = { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() };
        const nextErrors = {};
        if (isRegister && (normalized.name.length < 2 || normalized.name.length > 80)) nextErrors.name = "Name must be between 2 and 80 characters.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email) || normalized.email.length > 254) nextErrors.email = "Enter a valid email address.";
        if (!normalized.password) nextErrors.password = "Enter your password.";
        else if (new TextEncoder().encode(normalized.password).length > 72) nextErrors.password = "Password must be no more than 72 bytes.";
        else if (isRegister && normalized.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors);
            return;
        }

        setSaving(true);
        setErrors({});
        try {
            const payload = isRegister ? normalized : { email: normalized.email, password: normalized.password };
            const response = await fetch(`${AUTH_URL}/${isRegister ? "register" : "login"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                setErrors({ ...(result.errors || {}), form: result.message || "Authentication failed. Please try again." });
                return;
            }
            onAuthenticated(result.token, result.user);
            navigate("/ideas", { replace: true });
        } catch {
            setErrors({ form: "Could not reach the server. Check your connection and try again." });
        } finally {
            setSaving(false);
        }
    };

    return <section className={`auth-page ${isRegister ? "auth-register" : "auth-login"}`}>
        <div className="auth-visual">
            <Link className="auth-brand" to="/ideas"><span className="brand-mark">✳</span><span>spark<span className="brand-dot">.</span>hub</span></Link>
            <div className="auth-visual-copy"><p className="eyebrow">{isRegister ? "YOUR NEXT CHAPTER STARTS HERE" : "THE CAMPUS IDEA GREENHOUSE"}</p><h1>{isRegister ? <>Make room<br />for <em>what if.</em></> : <>Small spark.<br /><em>Big change.</em></>}</h1><p>{isRegister ? "Find your people, plant an idea, and help your campus grow into something better." : "Your community is already growing. Step back in and give your favorite ideas a little sunlight."}</p></div>
            <img className="auth-art" src="/idea-greenhouse.svg" alt="An illustrated campus greenhouse growing bright ideas" />
            <div className="auth-sticker"><span>{isRegister ? "01 / PLANT" : "FIELD NOTE 01"}</span><strong>{isRegister ? "Good things grow together." : "Ideas need a little tending."}</strong></div>
            <div className="idea-loop"><span>notice</span><i></i><span>imagine</span><i></i><span>grow</span></div>
            <small className="auth-number">SPARK / COMMUNITY NO. 01</small>
        </div>
        <form className="idea-form auth-form" onSubmit={submit} noValidate>
            <div className="auth-form-top"><div><p className="eyebrow">{isRegister ? "A BETTER CAMPUS STARTS WITH YOU" : "GOOD TO HAVE YOU BACK"}</p><h2>{isRegister ? "Come on in." : "Pick up a spark."}</h2><p className="auth-intro">{isRegister ? "One little account. A whole lot of possibility." : "Sign in and see what the community is dreaming up."}</p></div><Link className="close-button" to="/ideas" aria-label="Close authentication">×</Link></div>
            {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
            {isRegister && <label htmlFor="auth-name">Name<input id="auth-name" name="name" autoComplete="name" value={form.name} onChange={update} placeholder="Your name" minLength="2" maxLength="80" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "auth-name-error" : undefined} />{errors.name && <span className="field-error" id="auth-name-error">{errors.name}</span>}</label>}
            <label htmlFor="auth-email">Email<input id="auth-email" type="email" name="email" autoComplete="email" value={form.email} onChange={update} placeholder="you@campus.edu" maxLength="254" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "auth-email-error" : undefined} />{errors.email && <span className="field-error" id="auth-email-error">{errors.email}</span>}</label>
            <label htmlFor="auth-password">Password<input id="auth-password" type={showPassword ? "text" : "password"} name="password" autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={update} placeholder={isRegister ? "At least 8 characters" : "Your password"} minLength={isRegister ? 8 : undefined} maxLength="72" required aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "auth-password-error" : "auth-password-hint"} />{errors.password ? <span className="field-error" id="auth-password-error">{errors.password}</span> : isRegister && <small className="field-hint" id="auth-password-hint">Use at least 8 characters.</small>}</label>
            <label className="password-toggle"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> Show password</label>
            <button className="primary-button auth-submit" type="submit" disabled={saving}>{saving ? "One moment…" : isRegister ? "Plant your first idea" : "Back to the good ideas"}<span aria-hidden="true">↗</span></button>
            <p className="auth-switch">{isRegister ? "Already growing with us?" : "New around here?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Come back in" : "Make an account"}</Link></p>
            <p className="auth-footnote"><span aria-hidden="true">✳</span> A kind, curious corner of campus.</p>
        </form>
    </section>;
}

export default AuthForm;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, authHeaders, domains, emptyForm } from "../constants";

const rules = {
    title: { min: 3, max: 120, label: "Title" },
    problemStatement: { min: 20, max: 2000, label: "Problem statement" },
    technologies: { min: 1, max: 200, label: "Technologies" },
    expectedImpact: { min: 1, max: 2000, label: "Expected impact" }
};

function validateForm(form) {
    const errors = {};
    for (const [field, rule] of Object.entries(rules)) {
        const length = form[field].trim().length;
        if (length < rule.min || length > rule.max) errors[field] = `${rule.label} must be between ${rule.min} and ${rule.max} characters.`;
    }
    if (!domains.slice(1).includes(form.domain)) errors.domain = "Choose a valid campus domain.";
    return errors;
}

function IdeaForm({ idea, onSaved, token }) {
    const navigate = useNavigate();
    const isEditing = Boolean(idea);
    const [form, setForm] = useState(idea ? {
        title: idea.title || "",
        problemStatement: idea.problemStatement || "",
        domain: idea.domain || "Campus life",
        technologies: idea.technologies || "",
        expectedImpact: idea.expectedImpact || ""
    } : emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});

    const updateForm = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        setValidationErrors((current) => ({ ...current, [name]: "" }));
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const errors = validateForm(form);
        if (Object.keys(errors).length) {
            setValidationErrors(errors);
            return;
        }

        setSaving(true);
        setError("");
        try {
            const response = await fetch(isEditing ? `${API_URL}/${idea._id}` : API_URL, {
                method: isEditing ? "PUT" : "POST",
                headers: authHeaders(token, true),
                body: JSON.stringify(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])))
            });
            const responseData = await response.json().catch(() => ({}));
            if (!response.ok) {
                setValidationErrors(responseData.errors || {});
                throw new Error(responseData.message || "Could not save idea. Please try again.");
            }
            onSaved(responseData);
            navigate(`/ideas/${responseData._id}`);
        } catch (requestError) {
            setError(requestError.message || "Could not reach the server. Check your connection and try again.");
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (field) => validationErrors[field];
    const inputProps = (field) => ({
        id: `idea-${field}`,
        name: field,
        value: form[field],
        onChange: updateForm,
        required: true,
        className: fieldError(field) ? "input-error" : "",
        "aria-invalid": Boolean(fieldError(field)),
        "aria-describedby": fieldError(field) ? `idea-${field}-error` : undefined
    });
    const fieldMessage = (field) => fieldError(field) && <span className="field-error" id={`idea-${field}-error`}>{fieldError(field)}</span>;

    if (!token) return <section className="route-panel"><div className="empty-state"><p>Log in to submit and manage ideas.</p><Link to="/login">Log in</Link></div></section>;

    return <section className="route-panel"><form className="idea-form route-form" onSubmit={handleSubmit} noValidate>
        <div className="form-heading"><div><p className="eyebrow">{isEditing ? "REFINE YOUR IDEA" : "ADD TO THE BOARD"}</p><h2>{isEditing ? "Edit your idea" : "Share an idea"}</h2></div><Link className="close-button" to={isEditing ? `/ideas/${idea._id}` : "/ideas"} aria-label="Close form">×</Link></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <label htmlFor="idea-title">Idea title<input {...inputProps("title")} placeholder="Give your idea a memorable name" minLength={rules.title.min} maxLength={rules.title.max} />{fieldMessage("title")}</label>
        <label htmlFor="idea-problemStatement">Problem statement<textarea {...inputProps("problemStatement")} placeholder="What campus problem should we solve?" rows="4" minLength={rules.problemStatement.min} maxLength={rules.problemStatement.max} />{fieldMessage("problemStatement")}</label>
        <div className="form-row"><label htmlFor="idea-domain">Domain<select {...inputProps("domain")}>{domains.slice(1).map((domain) => <option key={domain} value={domain}>{domain}</option>)}</select>{fieldMessage("domain")}</label><label htmlFor="idea-technologies">Technology<input {...inputProps("technologies")} placeholder="e.g. React, IoT, mobile app" maxLength={rules.technologies.max} />{fieldMessage("technologies")}</label></div>
        <label htmlFor="idea-expectedImpact">Expected impact<textarea {...inputProps("expectedImpact")} placeholder="How will campus life improve?" rows="3" maxLength={rules.expectedImpact.max} />{fieldMessage("expectedImpact")}</label>
        <p className="field-hint">Your name and account type will be attached automatically.</p>
        <div className="form-actions"><Link className="text-button" to={isEditing ? `/ideas/${idea._id}` : "/ideas"}>Cancel</Link><button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save changes" : "Publish idea"}</button></div>
    </form></section>;
}

export default IdeaForm;
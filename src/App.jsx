import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useParams } from "react-router-dom";
import "./App.css";
import "./App.extra.css";
import IdeaDetails from "./components/IdeaDetails";
import IdeaFeed from "./components/IdeaFeed";
import IdeaForm from "./components/IdeaForm";
import AuthForm from "./components/AuthForm";
import Navbar from "./components/Navbar";
import { API_URL, AUTH_URL, authHeaders } from "./constants";

const defaultPagination = { page: 1, limit: 9, total: 0, pages: 0 };

async function readResponse(response) {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "The request could not be completed.");
    return result;
}

function RouteLoading({ message = "Loading idea…" }) {
    return <section className="route-panel"><p className="empty-state" role="status" aria-live="polite">{message}</p></section>;
}

function RouteError({ message, onRetry }) {
    return <section className="route-panel"><div className="empty-state" role="alert"><p>{message}</p>{onRetry ? <button type="button" onClick={onRetry}>Try again</button> : <Link to="/ideas">Back to ideas</Link>}</div></section>;
}

function IdeaDetailsRoute({ token, user, onDelete, onVote, onStatusChange }) {
    const { id } = useParams();
    const [idea, setIdea] = useState(null);
    const [loadedId, setLoadedId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/${encodeURIComponent(id)}`, { headers: authHeaders(token), signal: controller.signal })
            .then(readResponse)
            .then((result) => { setIdea(result); setError(""); setLoadedId(id); })
            .catch((requestError) => { if (requestError.name !== "AbortError") { setError(requestError.message); setLoadedId(id); } })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [id, token, reload]);

    if (loading || loadedId !== id) return <RouteLoading />;
    if (error) return <RouteError message={error} onRetry={() => { setLoading(true); setLoadedId(""); setError(""); setReload((value) => value + 1); }} />;
    return <IdeaDetails idea={idea} onDelete={onDelete} onVote={onVote} onStatusChange={onStatusChange} hasVoted={Boolean(idea?.hasVoted)} token={token} user={user} />;
}

function EditIdeaRoute({ token, onSaved }) {
    const { id } = useParams();
    const [idea, setIdea] = useState(null);
    const [loadedId, setLoadedId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${API_URL}/${encodeURIComponent(id)}`, { headers: authHeaders(token), signal: controller.signal })
            .then(readResponse)
            .then((result) => { setIdea(result); setError(""); setLoadedId(id); })
            .catch((requestError) => { if (requestError.name !== "AbortError") { setError(requestError.message); setLoadedId(id); } })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [id, token]);

    if (loading || loadedId !== id) return <RouteLoading message="Loading idea for editing…" />;
    if (error) return <RouteError message={error} />;
    return <IdeaForm idea={idea} onSaved={onSaved} token={token} />;
}

function readSavedUser() {
    try { return JSON.parse(localStorage.getItem("sparkHubUser") || "null"); }
    catch { return null; }
}

function App() {
    const [ideas, setIdeas] = useState([]);
    const [token, setToken] = useState(() => localStorage.getItem("sparkHubToken") || "");
    const [user, setUser] = useState(() => localStorage.getItem("sparkHubToken") ? readSavedUser() : null);
    const [filters, setFilters] = useState({ search: "", domain: "", status: "", sort: "newest", page: 1 });
    const [settledSearch, setSettledSearch] = useState("");
    const [pagination, setPagination] = useState(defaultPagination);
    const [loading, setLoading] = useState(true);
    const [feedError, setFeedError] = useState("");
    const [notice, setNotice] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const timer = window.setTimeout(() => setSettledSearch(filters.search), 250);
        return () => window.clearTimeout(timer);
    }, [filters.search]);

    useEffect(() => {
        if (!token) {
            localStorage.removeItem("sparkHubUser");
            return undefined;
        }
        const controller = new AbortController();
        fetch(`${AUTH_URL}/me`, { headers: authHeaders(token), signal: controller.signal })
            .then(async (response) => {
                if (response.status === 401) {
                    localStorage.removeItem("sparkHubToken");
                    localStorage.removeItem("sparkHubUser");
                    setToken("");
                    setUser(null);
                    setLoading(true);
                    setFeedError("");
                    return null;
                }
                return readResponse(response);
            })
            .then((result) => {
                if (!result) return;
                const { user: verifiedUser } = result;
                setUser(verifiedUser);
                localStorage.setItem("sparkHubUser", JSON.stringify(verifiedUser));
            })
            .catch((error) => {
                if (error.name === "AbortError") return;
                setNotice("Could not verify your session. Please check your connection.");
            });
        return () => controller.abort();
    }, [token]);

    useEffect(() => {
        const controller = new AbortController();
        const query = new URLSearchParams({ page: String(filters.page), limit: String(defaultPagination.limit), sort: filters.sort, search: settledSearch });
        if (filters.domain) query.set("domain", filters.domain);
        if (filters.status) query.set("status", filters.status);

        fetch(`${API_URL}?${query}`, { headers: authHeaders(token), signal: controller.signal })
            .then(readResponse)
            .then((result) => {
                if (result.pagination?.pages > 0 && filters.page > result.pagination.pages) {
                    setFilters((current) => ({ ...current, page: result.pagination.pages }));
                    setLoading(true);
                    return;
                }
                setIdeas(Array.isArray(result.data) ? result.data : []);
                setPagination(result.pagination || defaultPagination);
                setFeedError("");
            })
            .catch((error) => { if (error.name !== "AbortError") setFeedError(error.message || "Could not load ideas."); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [filters.domain, filters.page, filters.sort, filters.status, refreshKey, settledSearch, token]);

    const authenticate = (nextToken, nextUser) => {
        localStorage.setItem("sparkHubToken", nextToken);
        localStorage.setItem("sparkHubUser", JSON.stringify(nextUser));
        setToken(nextToken);
        setUser(nextUser);
        setLoading(true);
        setFeedError("");
        setNotice("");
    };

    const logout = () => {
        localStorage.removeItem("sparkHubToken");
        localStorage.removeItem("sparkHubUser");
        setToken("");
        setUser(null);
        setLoading(true);
        setFeedError("");
        setNotice("You have been logged out.");
    };

    const changeFilters = (nextFilters) => {
        setFilters(nextFilters);
        setLoading(true);
        setFeedError("");
    };

    const refreshIdeas = () => {
        setLoading(true);
        setFeedError("");
        setRefreshKey((value) => value + 1);
    };

    const handleSaved = (savedIdea) => {
        setIdeas((current) => [savedIdea, ...current.filter((idea) => idea._id !== savedIdea._id)]);
        refreshIdeas();
        setNotice("Your idea was saved successfully.");
    };

    const deleteIdea = async (id) => {
        if (!window.confirm("Remove this idea from the hub? This cannot be undone.")) return false;
        try {
            const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders(token) });
            await readResponse(response);
            setIdeas((current) => current.filter((idea) => idea._id !== id));
            refreshIdeas();
            setNotice("Idea deleted.");
            return true;
        } catch (error) {
            setNotice(error.message || "Could not delete this idea.");
            return false;
        }
    };

    const voteForIdea = async (id) => {
        try {
            const response = await fetch(`${API_URL}/${encodeURIComponent(id)}/vote`, { method: "POST", headers: authHeaders(token) });
            const result = await readResponse(response);
            setIdeas((current) => current.map((idea) => idea._id === id ? { ...idea, votes: result.votes, hasVoted: true } : idea));
            setNotice("Your vote has been counted.");
            return result;
        } catch (error) {
            setNotice(error.message || "Could not record your vote.");
            return null;
        }
    };

    const updateIdeaStatus = async (id, status) => {
        try {
            const response = await fetch(`${API_URL}/${encodeURIComponent(id)}/status`, {
                method: "PATCH",
                headers: authHeaders(token, true),
                body: JSON.stringify({ status })
            });
            const updatedIdea = await readResponse(response);
            setIdeas((current) => current.map((idea) => idea._id === id ? { ...idea, status: updatedIdea.status } : idea));
            setNotice("Idea status updated.");
            return updatedIdea;
        } catch (error) {
            setNotice(error.message || "Could not update the idea status.");
            return null;
        }
    };

    const feed = <IdeaFeed ideas={ideas} pagination={pagination} filters={filters} onFiltersChange={changeFilters} onDelete={deleteIdea} onVote={voteForIdea} token={token} user={user} loading={loading} error={feedError} onRetry={refreshIdeas} />;

    return <BrowserRouter><div className="app-shell"><Navbar token={token} user={user} onLogout={logout} />{notice && <div className="app-notice" role="status" aria-live="polite">{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}<main><Routes><Route path="/" element={feed} /><Route path="/ideas" element={feed} /><Route path="/ideas/:id" element={<IdeaDetailsRoute token={token} user={user} onDelete={deleteIdea} onVote={voteForIdea} onStatusChange={updateIdeaStatus} />} /><Route path="/submit" element={<IdeaForm onSaved={handleSaved} token={token} />} /><Route path="/edit/:id" element={<EditIdeaRoute onSaved={handleSaved} token={token} />} /><Route path="/login" element={<AuthForm mode="login" onAuthenticated={authenticate} />} /><Route path="/register" element={<AuthForm mode="register" onAuthenticated={authenticate} />} /><Route path="*" element={feed} /></Routes></main></div></BrowserRouter>;
}

export default App;
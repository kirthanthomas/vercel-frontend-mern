import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { statuses } from "../constants";

function IdeaDetails({ idea, onDelete, onVote, onStatusChange, hasVoted, token, user }) {
    const navigate = useNavigate();
    const [voting, setVoting] = useState(false);
    const [voteCount, setVoteCount] = useState(idea?.votes || 0);
    const [voted, setVoted] = useState(hasVoted);
    const [displayStatus, setDisplayStatus] = useState(idea?.status || "Submitted");
    const [nextStatus, setNextStatus] = useState(idea?.status || "Submitted");
    const [statusSaving, setStatusSaving] = useState(false);
    const canManage = Boolean(idea && user && (user.role === "admin" || user.id === idea.owner));

    if (!idea) return <section className="route-panel"><div className="empty-state"><p>That idea could not be found.</p><Link to="/ideas">Back to ideas</Link></div></section>;

    const deleteCurrentIdea = async () => {
        if (await onDelete(idea._id)) navigate("/ideas");
    };

    const saveStatus = async () => {
        setStatusSaving(true);
        try {
            const updatedIdea = await onStatusChange(idea._id, nextStatus);
            if (updatedIdea) setDisplayStatus(updatedIdea.status);
        } finally {
            setStatusSaving(false);
        }
    };

    return <section className="route-panel"><article className="idea-detail-page">
        <Link className="back-link" to="/ideas">← Back to all ideas</Link>
        <div className="detail-heading"><div><p className="eyebrow">IDEA DETAILS</p><h2>{idea.title}</h2></div><span className={`status status-${displayStatus.toLowerCase().replaceAll(" ", "-")}`}>{displayStatus}</span></div>
        <div className="detail-vote">▲ {voteCount} votes</div>
        <div className="view-section"><span>Problem statement</span><p>{idea.problemStatement}</p></div>
        <div className="view-detail-grid"><div><span>Domain</span><strong>{idea.domain}</strong></div><div><span>Technology</span><strong>{idea.technologies}</strong></div></div>
        <div className="view-section"><span>Expected impact</span><p>{idea.expectedImpact}</p></div>
        <div className="view-author"><span className="avatar">{idea.author?.charAt(0).toUpperCase()}</span><span><strong>{idea.author}</strong><small>{idea.authorRole || "Student"}</small></span></div>
        {user?.role === "admin" && <div className="admin-status"><label htmlFor="idea-status-update">Update progress status<select id="idea-status-update" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>{statuses.slice(1).map((status) => <option key={status}>{status}</option>)}</select></label><button type="button" className="outline-button" onClick={saveStatus} disabled={statusSaving || nextStatus === displayStatus}>{statusSaving ? "Updating…" : "Update status"}</button></div>}
        <div className="detail-actions">{token && <button className={`primary-button ${voted ? "voted" : ""}`} type="button" disabled={voted || voting || user?.id === idea.owner} onClick={async () => { setVoting(true); try { const result = await onVote(idea._id); if (result) { setVoteCount(result.votes); setVoted(true); } } finally { setVoting(false); } }}>{user?.id === idea.owner ? "Your idea" : voted ? "Voted" : voting ? "Voting…" : "▲ Vote for this idea"}</button>}{canManage && <button className="outline-button" type="button" onClick={() => navigate(`/edit/${idea._id}`)}>Edit idea</button>}{canManage && <button className="outline-button" type="button" onClick={deleteCurrentIdea}>Delete idea</button>}</div>
    </article></section>;
}

export default IdeaDetails;
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function IdeaCard({ idea, onDelete, onVote, hasVoted, token, user }) {
    const navigate = useNavigate();
    const [voting, setVoting] = useState(false);
    const date = idea.createdAt ? new Date(idea.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "New";
    const statusClass = (idea.status || "Submitted").toLowerCase().replaceAll(" ", "-");
    const canManage = Boolean(user && (user.role === "admin" || user.id === idea.owner));
    const isOwner = user?.id === idea.owner;

    return <article className="idea-card">
        <div className="idea-card-top"><span className={`status status-${statusClass}`}>{idea.status || "Exploring"}</span><span className="idea-date">{date}</span></div>
        <h3>{idea.title}</h3>
        <div className="idea-detail"><span>Problem</span><p>{idea.problemStatement}</p></div>
        <div className="idea-meta-grid"><div><span>Domain</span><strong>{idea.domain}</strong></div><div><span>Technology</span><strong>{idea.technologies}</strong></div><div><span>Expected impact</span><strong>{idea.expectedImpact}</strong></div></div>
        <div className="idea-author"><span className="avatar">{idea.author?.charAt(0).toUpperCase()}</span><span><strong>{idea.author}</strong><small>{idea.authorRole || "Student"}</small></span></div>
        <div className="idea-card-footer"><button className={`vote-button ${hasVoted ? "voted" : ""}`} onClick={async () => { setVoting(true); try { await onVote(idea._id); } finally { setVoting(false); } }} disabled={!token || hasVoted || voting || isOwner} aria-label={`${isOwner ? "Your idea" : hasVoted ? "Already voted for" : "Vote for"} ${idea.title}`}>{isOwner ? "Your idea" : hasVoted ? "Voted" : voting ? "Voting..." : token ? "▲ Vote" : "Log in to vote"} <span>{idea.votes || 0}</span></button><div className="card-actions"><button type="button" onClick={() => navigate(`/ideas/${idea._id}`)}>View</button>{canManage && <button type="button" onClick={() => navigate(`/edit/${idea._id}`)}>Edit</button>}{canManage && <button type="button" onClick={() => onDelete(idea._id)} className="danger">Delete</button>}</div></div>
    </article>;
}

export default IdeaCard;

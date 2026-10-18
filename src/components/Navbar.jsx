import { Link, NavLink } from "react-router-dom";

function Navbar({ token, user, onLogout }) {
    return <header className="topbar">
        <Link className="brand" to="/ideas"><span className="brand-mark">+</span><span>spark<span className="brand-dot">.</span>hub</span></Link>
        <nav><NavLink className={({ isActive }) => isActive ? "nav-active" : ""} to="/ideas">Explore ideas</NavLink><a href="/#how-it-works">How it works</a></nav>
        {token ? <button className="profile-button" type="button" onClick={onLogout}>{user?.name ? `${user.name} · Log out` : "Log out"}</button> : <Link className="profile-button auth-link" to="/login">Log in</Link>}
    </header>;
}

export default Navbar;

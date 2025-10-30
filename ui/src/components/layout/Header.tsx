import { Link, useLocation } from "react-router-dom";
import { useScrollPosition } from "../../hooks/useScrollPosition";
import logo from "../../assets/twin-keys-logo-blue.svg";

export function Header() {
	const isScrolled = useScrollPosition(50);
	const location = useLocation();

	// Don't show header on login page
	if (location.pathname === "/login") {
		return null;
	}

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				isScrolled ? "bg-base-100" : "bg-transparent"
			}`}
		>
			<div className="navbar max-w-7xl mx-auto px-4">
				<div className="navbar-start">
					<Link
						to="/"
						className="btn btn-ghost text-xl font-display font-normal"
					>
						<img src={logo} alt="Twin Keys" className="w-7 h-7" />
						Twin Keys
					</Link>
				</div>
				<div className="navbar-center hidden lg:flex">
					<ul className="menu menu-horizontal px-1">
						<li>
							<Link to="/">Home</Link>
						</li>
						<li>
							<Link to="/dashboard">Dashboard</Link>
						</li>
					</ul>
				</div>
				<div className="navbar-end">
					<Link
						to="/login"
						className="btn btn-primary"
					>
						Get Started
					</Link>
				</div>
			</div>
		</header>
	);
}

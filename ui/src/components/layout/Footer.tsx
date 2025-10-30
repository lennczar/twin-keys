import { KeyRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Footer() {
	const location = useLocation();

	// Don't show footer on login page
	if (location.pathname === "/login") {
		return null;
	}

	return (
		<footer className="bg-base-100 border-t border-base-300">
			<div className="max-w-7xl mx-auto px-4 py-16">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div className="col-span-1 md:col-span-2">
						<Link
							to="/"
							className="flex items-center gap-2 font-display text-xl font-normal mb-4"
						>
							<KeyRound className="w-6 h-6" />
							Twin Keys
						</Link>
						<p className="text-base-content/70 max-w-md">
							Anti-coercion protection for self-custody wallets. Create and maintain realistic twin
							wallets that mirror real on-chain activity.
						</p>
					</div>
					<div>
						<h3 className="font-display font-semibold mb-4">Product</h3>
						<ul className="space-y-2">
							<li>
								<Link
									to="/dashboard"
									className="link link-hover text-base-content/70"
								>
									Dashboard
								</Link>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="font-display font-semibold mb-4">Resources</h3>
						<ul className="space-y-2">
							<li>
								<a
									href="#"
									className="link link-hover text-base-content/70"
								>
									Pitch Deck
								</a>
							</li>
							<li>
								<a
									href="#"
									className="link link-hover text-base-content/70"
								>
									Colloseum Pitch
								</a>
							</li>
						</ul>
					</div>
				</div>
				<div className="divider"></div>
				<div className="text-center text-base-content/70 text-sm">
					<p>&copy; {new Date().getFullYear()} Twin Keys. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}

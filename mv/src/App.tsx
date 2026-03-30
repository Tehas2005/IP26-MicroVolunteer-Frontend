import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthPage from './pages/auth/AuthPage1';

// Placeholder până când colegii implementează dashboard-ul
function Dashboard() {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				fontFamily: "sans-serif",
			}}
		>
			<div style={{ textAlign: "center" }}>
				<h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
					Dashboard
				</h1>
				<p style={{ color: "#888" }}>Autentificare reușită! 🎉</p>
			</div>
		</div>
	);
}

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/auth" element={<AuthPage />} />
				<Route path="/dashboard" element={<Dashboard />} />
				{/* Redirect implicit către /auth */}
				<Route path="*" element={<Navigate to="/auth" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

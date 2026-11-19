import type { Utente } from "../types";

interface NavbarProps {
    utente: Utente;
    onLogout: () => void;
}

export function Navbar({ utente, onLogout }: NavbarProps) {
    return (
        <header className="navbar">
            <div className="navbar-brand">
                <span className="navbar-logo">💼</span>
                <span className="navbar-title">FinanceFlow</span>
            </div>
            <div className="navbar-user">
                <span className="user-email">👤 {utente.email}</span>
                <button onClick={onLogout} className="btn-logout">
                    Esci
                </button>
            </div>
        </header>
    );
}

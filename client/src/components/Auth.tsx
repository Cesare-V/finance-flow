import { useState } from "react";
import type { Utente } from "../types";

interface AuthProps {
    onSuccess: (token: string, utente: Utente) => void;
}

export function Auth({ onSuccess }: AuthProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errore, setErrore] = useState<string | null>(null);
    const [caricamento, setCaricamento] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrore(null);
        setCaricamento(true);

        const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

        try {
            const res = await fetch(`http://localhost:3000${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.errore || "Errore durante l'operazione.");
            }

            // Successo: passiamo token e utente al genitore
            onSuccess(data.token, data.utente);

        } catch (err: unknown) {
            if (err instanceof Error) {
                setErrore(err.message);
            } else {
                setErrore("Si è verificato un errore imprevisto.");
            }
        } finally {
            setCaricamento(false);
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="auth-logo">💼</span>
                    <h2>FinanceFlow</h2>
                    <p>{isLogin ? "Accedi per gestire le tue finanze" : "Crea un nuovo account gratuito"}</p>
                </div>

                {errore && <div className="alert-error">{errore}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="es. cesare@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            placeholder="Almeno 6 caratteri"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={caricamento}>
                        {caricamento ? "Caricamento..." : (isLogin ? "Accedi" : "Registrati")}
                    </button>
                </form>

                <div className="auth-footer">
                    <button
                        type="button"
                        className="btn-link"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setErrore(null);
                        }}
                    >
                        {isLogin
                            ? "Non hai un account? Registrati"
                            : "Hai già un account? Accedi"}
                    </button>
                </div>
            </div>
        </div>
    );
}

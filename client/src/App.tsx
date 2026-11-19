import { useState, useEffect } from "react";
import type { Utente, Transazione } from "./types";
import { Auth } from "./components/Auth";
import { Navbar } from "./components/Navbar";
import { RiepilogoCards } from "./components/RiepilogoCards";
import { FormTransazione } from "./components/FormTransazione";
import { ListaTransazioni } from "./components/ListaTransazioni";
import "./App.css";

export default function App() {
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem("financeflow_token");
    });
    const [utente, setUtente] = useState<Utente | null>(null);
    const [transazioni, setTransazioni] = useState<Transazione[]>([]);
    const [caricamento, setCaricamento] = useState<boolean>(true);

    // 👈 1. CONTROLLO SESSIONE ALL'AVVIO
    useEffect(() => {
        if (!token) {
            setCaricamento(false);
            return;
        }

        async function verificaSessioneECaricaDati() {
            try {
                // A) Verifica se il token è ancora valido
                const resAuth = await fetch("http://localhost:3000/api/auth/me", {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (!resAuth.ok) {
                    throw new Error("Sessione scaduta.");
                }

                const dataAuth = await resAuth.json();
                setUtente(dataAuth.utente);

                // B) Carica le transazioni dell'utente
                const resTransazioni = await fetch("http://localhost:3000/api/transazioni", {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (resTransazioni.ok) {
                    const dataTransazioni = await resTransazioni.json();
                    setTransazioni(dataTransazioni);
                }

            } catch (error) {
                console.error("Sessione non valida:", error);
                // Se il token è scaduto o alterato, ripuliamo
                localStorage.removeItem("financeflow_token");
                setToken(null);
                setUtente(null);
            } finally {
                setCaricamento(false);
            }
        }

        verificaSessioneECaricaDati();
    }, [token]);

    // 👈 2. GESTIONE LOGIN & REGISTRAZIONE
    function handleLoginSuccess(nuovoToken: string, nuovoUtente: Utente) {
        localStorage.setItem("financeflow_token", nuovoToken);
        setToken(nuovoToken);
        setUtente(nuovoUtente);
    }

    // 👈 3. LOGOUT
    function handleLogout() {
        localStorage.removeItem("financeflow_token");
        setToken(null);
        setUtente(null);
        setTransazioni([]);
    }

    // 👈 4. AGGIUNGI TRANSAZIONE (Stato Ottimistico / Istantaneo)
    function handleTransazioneCreata(nuova: Transazione) {
        setTransazioni((prev) => [nuova, ...prev]);
    }

    // 👈 5. ELIMINA TRANSAZIONE (.filter())
    function handleTransazioneEliminata(id: number) {
        setTransazioni((prev) => prev.filter((t) => t.id !== id));
    }

    if (caricamento) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Caricamento di FinanceFlow...</p>
            </div>
        );
    }

    // SE NON È AUTENTICATO: Mostra Login / Registrazione
    if (!token || !utente) {
        return <Auth onSuccess={handleLoginSuccess} />;
    }

    // SE È AUTENTICATO: Mostra la Dashboard Completa
    return (
        <div className="app-layout">
            <Navbar utente={utente} onLogout={handleLogout} />

            <main className="dashboard-content">
                <div className="dashboard-header">
                    <h2>Bentornato, {utente.email.split("@")[0]} 👋</h2>
                    <p>Ecco la panoramica finanziaria del tuo mese</p>
                </div>

                {/* 1. CARTELLI CON I CONTEGGI */}
                <RiepilogoCards transazioni={transazioni} />

                {/* 2. GRIGLIA FORM + LISTA */}
                <div className="dashboard-grid">
                    <section className="col-form">
                        <FormTransazione
                            token={token}
                            onTransazioneCreata={handleTransazioneCreata}
                        />
                    </section>

                    <section className="col-lista">
                        <ListaTransazioni
                            transazioni={transazioni}
                            token={token}
                            onTransazioneEliminata={handleTransazioneEliminata}
                        />
                    </section>
                </div>
            </main>
        </div>
    );
}

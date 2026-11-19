import { useState } from "react";
import type { Transazione, TipoTransazione } from "../types";

interface ListaProps {
    transazioni: Transazione[];
    token: string;
    onTransazioneEliminata: (id: number) => void;
}

const ICONE_CATEGORIE: Record<string, string> = {
    Cibo: "🍔",
    Casa: "🏠",
    Lavoro: "💼",
    Svago: "🎮",
    Trasporti: "🚗",
    Salute: "💊",
    Animali: "🐶",
    Altro: "📦"
};

export function ListaTransazioni({ transazioni, token, onTransazioneEliminata }: ListaProps) {
    const [filtroTipo, setFiltroTipo] = useState<"TUTTE" | TipoTransazione>("TUTTE");
    const [ricerca, setRicerca] = useState("");
    const [eliminandoId, setEliminandoId] = useState<number | null>(null);

    // 👈 USO DI .filter() PER RICERCA E CATEGORIE
    const transazioniFiltrate = transazioni.filter((t) => {
        const combaciaTipo = filtroTipo === "TUTTE" || t.tipo === filtroTipo;
        const combaciaTesto = t.titolo.toLowerCase().includes(ricerca.toLowerCase());
        return combaciaTipo && combaciaTesto;
    });

    async function handleElimina(id: number) {
        if (!confirm("Sei sicuro di voler eliminare questa transazione?")) return;

        setEliminandoId(id);

        try {
            const res = await fetch(`http://localhost:3000/api/transazioni/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.errore || "Impossibile eliminare.");
            }

            onTransazioneEliminata(id);

        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Errore durante l'eliminazione.");
        } finally {
            setEliminandoId(null);
        }
    }

    function formattaEuro(valore: number) {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR"
        }).format(valore);
    }

    function formattaData(dataString: string) {
        const d = new Date(dataString);
        return d.toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    return (
        <div className="lista-container">
            <div className="lista-header">
                <h3>📋 Storico Movimenti ({transazioniFiltrate.length})</h3>

                <div className="controlli-filtro">
                    <input
                        type="text"
                        placeholder="🔍 Cerca operazione..."
                        value={ricerca}
                        onChange={(e) => setRicerca(e.target.value)}
                        className="input-search"
                    />

                    <div className="tabs-filtro">
                        <button
                            className={`tab ${filtroTipo === "TUTTE" ? "tab-active" : ""}`}
                            onClick={() => setFiltroTipo("TUTTE")}
                        >
                            Tutte
                        </button>
                        <button
                            className={`tab ${filtroTipo === "ENTRATA" ? "tab-active" : ""}`}
                            onClick={() => setFiltroTipo("ENTRATA")}
                        >
                            Entrate
                        </button>
                        <button
                            className={`tab ${filtroTipo === "USCITA" ? "tab-active" : ""}`}
                            onClick={() => setFiltroTipo("USCITA")}
                        >
                            Uscite
                        </button>
                    </div>
                </div>
            </div>

            {transazioniFiltrate.length === 0 ? (
                <div className="empty-state">
                    <p className="empty-icon">📭</p>
                    <p className="empty-title">Nessun movimento trovato</p>
                    <p className="empty-subtext">
                        {transazioni.length === 0
                            ? "Non hai ancora registrato nessuna spesa o entrata. Inizia aggiungendone una dal form a fianco!"
                            : "Nessun movimento corrisponde ai filtri selezionati."}
                    </p>
                </div>
            ) : (
                <ul className="transazioni-list">
                    {/* 👈 USO DI .map() CON key={t.id} */}
                    {transazioniFiltrate.map((t) => {
                        const icona = ICONE_CATEGORIE[t.categoria] || "🏷️";
                        const isEntrata = t.tipo === "ENTRATA";

                        return (
                            <li key={t.id} className="transazione-item">
                                <div className="item-left">
                                    <span className="categoria-icon">{icona}</span>
                                    <div className="item-info">
                                        <h4 className="item-titolo">{t.titolo}</h4>
                                        <div className="item-meta">
                                            <span className="badge-categoria">{t.categoria}</span>
                                            <span className="item-data">{formattaData(t.data)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="item-right">
                                    <span className={`item-importo ${isEntrata ? "text-green" : "text-red"}`}>
                                        {isEntrata ? "+" : "-"}{formattaEuro(t.importo)}
                                    </span>
                                    <button
                                        onClick={() => handleElimina(t.id)}
                                        className="btn-delete"
                                        disabled={eliminandoId === t.id}
                                        title="Elimina transazione"
                                    >
                                        {eliminandoId === t.id ? "..." : "🗑️"}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

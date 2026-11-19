import { useState } from "react";
import type { TipoTransazione, CategoriaTransazione, Transazione } from "../types";

interface FormProps {
    token: string;
    onTransazioneCreata: (transazione: Transazione) => void;
}

const CATEGORIE: CategoriaTransazione[] = [
    "Cibo",
    "Casa",
    "Lavoro",
    "Svago",
    "Trasporti",
    "Salute",
    "Animali",
    "Altro"
];

export function FormTransazione({ token, onTransazioneCreata }: FormProps) {
    const [titolo, setTitolo] = useState("");
    const [importo, setImporto] = useState("");
    const [tipo, setTipo] = useState<TipoTransazione>("USCITA");
    const [categoria, setCategoria] = useState<CategoriaTransazione>("Cibo");
    const [data, setData] = useState(() => new Date().toISOString().split("T")[0]);
    const [caricamento, setCaricamento] = useState(false);
    const [errore, setErrore] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrore(null);

        const valoreNumerico = parseFloat(importo);
        if (isNaN(valoreNumerico) || valoreNumerico <= 0) {
            setErrore("Inserisci un importo valido maggiore di zero.");
            return;
        }

        setCaricamento(true);

        try {
            const res = await fetch("http://localhost:3000/api/transazioni", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // 👈 Mostriamo il braccialetto VIP!
                },
                body: JSON.stringify({
                    titolo,
                    importo: valoreNumerico,
                    tipo,
                    categoria,
                    data
                })
            });

            const dataRes = await res.json();

            if (!res.ok) {
                throw new Error(dataRes.errore || "Errore nel salvataggio.");
            }

            // Aggiungiamo la nuova transazione allo stato in React!
            onTransazioneCreata(dataRes);

            // Resettiamo solo i campi variabili
            setTitolo("");
            setImporto("");

        } catch (err: unknown) {
            if (err instanceof Error) {
                setErrore(err.message);
            } else {
                setErrore("Errore imprevisto.");
            }
        } finally {
            setCaricamento(false);
        }
    }

    return (
        <div className="form-card">
            <h3 className="form-card-title">➕ Nuova Operazione</h3>

            {errore && <div className="alert-error">{errore}</div>}

            <form onSubmit={handleSubmit} className="transazione-form">
                {/* TIPO: ENTRATA O USCITA */}
                <div className="tipo-selector">
                    <button
                        type="button"
                        className={`btn-tipo ${tipo === "USCITA" ? "active-uscita" : ""}`}
                        onClick={() => {
                            setTipo("USCITA");
                            if (categoria === "Lavoro") setCategoria("Cibo");
                        }}
                    >
                        📉 Uscita
                    </button>
                    <button
                        type="button"
                        className={`btn-tipo ${tipo === "ENTRATA" ? "active-entrata" : ""}`}
                        onClick={() => {
                            setTipo("ENTRATA");
                            setCategoria("Lavoro");
                        }}
                    >
                        📈 Entrata
                    </button>
                </div>

                <div className="form-row">
                    <div className="form-group flex-2">
                        <label htmlFor="titolo">Descrizione / Titolo</label>
                        <input
                            id="titolo"
                            type="text"
                            required
                            placeholder={tipo === "USCITA" ? "es. Spesa supermercato" : "es. Stipendio mensile"}
                            value={titolo}
                            onChange={(e) => setTitolo(e.target.value)}
                        />
                    </div>

                    <div className="form-group flex-1">
                        <label htmlFor="importo">Importo (€)</label>
                        <input
                            id="importo"
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="0.00"
                            value={importo}
                            onChange={(e) => setImporto(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group flex-1">
                        <label htmlFor="categoria">Categoria</label>
                        <select
                            id="categoria"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value as CategoriaTransazione)}
                        >
                            {CATEGORIE.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group flex-1">
                        <label htmlFor="data">Data</label>
                        <input
                            id="data"
                            type="date"
                            required
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                        />
                    </div>
                </div>

                <button type="submit" className="btn-primary" disabled={caricamento}>
                    {caricamento ? "Salvataggio..." : "Registra Operazione"}
                </button>
            </form>
        </div>
    );
}

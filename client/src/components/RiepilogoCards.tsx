import type { Transazione } from "../types";

interface RiepilogoProps {
    transazioni: Transazione[];
}

export function RiepilogoCards({ transazioni }: RiepilogoProps) {
    // 👈 USO DI .filter() e .reduce() NEL MONDO REALE!
    const entrateTotali = transazioni
        .filter((t) => t.tipo === "ENTRATA")
        .reduce((somma, t) => somma + t.importo, 0);

    const usciteTotali = transazioni
        .filter((t) => t.tipo === "USCITA")
        .reduce((somma, t) => somma + t.importo, 0);

    const saldo = entrateTotali - usciteTotali;

    // Formattatore di valuta per l'Italia (€ 1.250,50)
    function formattaEuro(valore: number) {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR"
        }).format(valore);
    }

    return (
        <section className="cards-grid">
            {/* CARD 1: SALDO TOTALE */}
            <div className={`card ${saldo >= 0 ? "card-positivo" : "card-negativo"}`}>
                <div className="card-header">
                    <span className="card-title">Saldo Netto</span>
                    <span className="card-icon">🏦</span>
                </div>
                <div className="card-value">{formattaEuro(saldo)}</div>
                <p className={`card-subtext ${saldo < 0 ? "text-red" : ""}`}>
                    {saldo < 0 
                    ? "⚠️ Attenzione: sei in passivo questo mese!" 
                    : "Differenza entrate e uscite"}
                </p>
            </div>

            {/* CARD 2: ENTRATE TOTALI */}
            <div className="card card-entrate">
                <div className="card-header">
                    <span className="card-title">Entrate Totali</span>
                    <span className="card-icon">📈</span>
                </div>
                <div className="card-value text-green">+{formattaEuro(entrateTotali)}</div>
                <p className="card-subtext">
                    {transazioni.filter((t) => t.tipo === "ENTRATA").length} movimenti
                </p>
            </div>

            {/* CARD 3: USCITE TOTALI */}
            <div className="card card-uscite">
                <div className="card-header">
                    <span className="card-title">Uscite Totali</span>
                    <span className="card-icon">📉</span>
                </div>
                <div className="card-value text-red">-{formattaEuro(usciteTotali)}</div>
                <p className="card-subtext">
                    {transazioni.filter((t) => t.tipo === "USCITA").length} movimenti
                </p>
            </div>
        </section>
    );
}

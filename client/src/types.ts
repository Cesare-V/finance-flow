export interface Utente {
    id: number;
    email: string;
}

export type TipoTransazione = "ENTRATA" | "USCITA";

export type CategoriaTransazione = 
    | "Cibo"
    | "Casa"
    | "Lavoro"
    | "Svago"
    | "Trasporti"
    | "Salute"
    | "Altro";

export interface Transazione {
    id: number;
    titolo: string;
    importo: number;
    tipo: TipoTransazione;
    categoria: CategoriaTransazione | string;
    data: string;
    creatoIl?: string;
    utenteId: number;
}

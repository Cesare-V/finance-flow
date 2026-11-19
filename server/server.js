require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("❌ ERRORE CRITICO: JWT_SECRET non trovato nel file .env!");
    process.exit(1);
}

// ==========================================
// 🛡️ MIDDLEWARE GLOBALI
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// 🔒 MIDDLEWARE DI AUTENTICAZIONE (Il Guardiano VIP)
// ==========================================
function autenticaToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // L'header arriva nel formato: "Bearer eyJhbGciOi..."
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ errore: "Accesso negato: token mancante. Effettua il login." });
    }

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(403).json({ errore: "Token non valido o scaduto." });
        }
        // Il payload contiene { id, email } dell'utente: lo salviamo nella richiesta!
        req.utente = payload;
        next(); // Autorizzato: passa alla rotta successiva!
    });
}

// ==========================================
// 🚀 ROTTA DI TEST (Health Check)
// ==========================================
app.get('/', (req, res) => {
    res.json({ status: "ok", app: "FinanceFlow API v1.0", messaggio: "Server attivo e funzionante!" });
});

// ==========================================
// 👤 ROTTE DI AUTENTICAZIONE
// ==========================================

// 1. REGISTRAZIONE NUOVO UTENTE
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ errore: "Email e password sono obbligatorie." });
        }

        const emailPulita = email.trim().toLowerCase();

        // Verifica se l'utente esiste già
        const utenteEsistente = await prisma.utente.findUnique({
            where: { email: emailPulita }
        });

        if (utenteEsistente) {
            return res.status(400).json({ errore: "Questa email è già registrata." });
        }

        // Hashing della password con Salt
        const passwordHash = await bcrypt.hash(password, 10);

        // Creazione dell'utente nel database
        const nuovoUtente = await prisma.utente.create({
            data: {
                email: emailPulita,
                password: passwordHash
            }
        });

        // Generiamo subito il token per fare il login automatico post-registrazione
        const token = jwt.sign(
            { id: nuovoUtente.id, email: nuovoUtente.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            messaggio: "Registrazione completata con successo!",
            token,
            utente: { id: nuovoUtente.id, email: nuovoUtente.email }
        });

    } catch (error) {
        console.error("Errore nella registrazione:", error);
        res.status(500).json({ errore: "Errore interno durante la registrazione." });
    }
});

// 2. LOGIN UTENTE
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ errore: "Email e password obbligatorie." });
        }

        const emailPulita = email.trim().toLowerCase();
        const utente = await prisma.utente.findUnique({
            where: { email: emailPulita }
        });

        if (!utente) {
            return res.status(401).json({ errore: "Credenziali non valide." });
        }

        const passwordValida = await bcrypt.compare(password, utente.password);
        if (!passwordValida) {
            return res.status(401).json({ errore: "Credenziali non valide." });
        }

        // Genera token JWT valido per 7 giorni
        const token = jwt.sign(
            { id: utente.id, email: utente.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            messaggio: "Login effettuato con successo!",
            token,
            utente: { id: utente.id, email: utente.email }
        });

    } catch (error) {
        console.error("Errore nel login:", error);
        res.status(500).json({ errore: "Errore interno durante il login." });
    }
});

// 3. STATO SESSIONE (Verifica se il token memorizzato è ancora valido)
app.get('/api/auth/me', autenticaToken, (req, res) => {
    res.json({ utente: req.utente });
});

// ==========================================
// 💰 ROTTE TRANSAZIONI (Protette da Token!)
// ==========================================

// 1. GET: Legge tutte le transazioni DELL'UTENTE AUTENTICATO
app.get('/api/transazioni', autenticaToken, async (req, res) => {
    try {
        const transazioni = await prisma.transazione.findMany({
            where: { utenteId: req.utente.id }, // 👈 Filtra SOLO i dati dell'utente!
            orderBy: { data: 'desc' }
        });
        res.json(transazioni);
    } catch (error) {
        console.error("Errore recupero transazioni:", error);
        res.status(500).json({ errore: "Impossibile recuperare le transazioni." });
    }
});

// 2. POST: Crea una nuova transazione per l'utente loggato
app.post('/api/transazioni', autenticaToken, async (req, res) => {
    try {
        const { titolo, importo, tipo, categoria, data } = req.body;

        if (!titolo || titolo.trim() === "") {
            return res.status(400).json({ errore: "Il titolo della transazione è obbligatorio." });
        }

        const importoNumerico = parseFloat(importo);
        if (isNaN(importoNumerico) || importoNumerico <= 0) {
            return res.status(400).json({ errore: "L'importo deve essere un numero positivo." });
        }

        if (tipo !== "ENTRATA" && tipo !== "USCITA") {
            return res.status(400).json({ errore: "Il tipo deve essere 'ENTRATA' oppure 'USCITA'." });
        }

        const nuova = await prisma.transazione.create({
            data: {
                titolo: titolo.trim(),
                importo: importoNumerico,
                tipo,
                categoria: categoria || "Altro",
                data: data ? new Date(data) : new Date(),
                utenteId: req.utente.id // 👈 Collega la transazione all'utente!
            }
        });

        res.status(201).json(nuova);

    } catch (error) {
        console.error("Errore creazione transazione:", error);
        res.status(500).json({ errore: "Errore durante il salvataggio della transazione." });
    }
});

// 3. DELETE: Elimina una transazione (con controllo di proprietà!)
app.delete('/api/transazioni/:id', autenticaToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ errore: "ID transazione non valido." });
        }

        // Verifica che la transazione esista E appartenga all'utente loggato
        const transazione = await prisma.transazione.findFirst({
            where: {
                id: id,
                utenteId: req.utente.id
            }
        });

        if (!transazione) {
            return res.status(404).json({ errore: "Transazione non trovata o non autorizzato a eliminarla." });
        }

        await prisma.transazione.delete({
            where: { id: id }
        });

        res.json({ messaggio: "Transazione eliminata con successo.", idEliminato: id });

    } catch (error) {
        console.error("Errore eliminazione transazione:", error);
        res.status(500).json({ errore: "Impossibile eliminare la transazione." });
    }
});

// ==========================================
// 🚀 AVVIO DEL SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 FinanceFlow Server attivo su http://localhost:${PORT}`);
});

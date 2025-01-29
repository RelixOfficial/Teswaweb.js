const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3000;

// Inisialisasi WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(), // Simpan session secara lokal
    puppeteer: { headless: true }  // Jalankan browser secara headless
});

// Event ketika QR code dihasilkan
client.on('qr', (qr) => {
    console.log('QR code diterima, silakan scan:');
    qrcode.generate(qr, { small: true }); // Tampilkan QR code di terminal
});

// Event ketika client sudah siap
client.on('ready', () => {
    console.log('Client WhatsApp siap!');
});

// Event ketika terjadi error
client.on('auth_failure', (msg) => {
    console.error('Autentikasi gagal:', msg);
});

// Mulai client WhatsApp
client.initialize();

// Endpoint untuk mendapatkan QR code
app.get('/scanqr', (req, res) => {
    client.on('qr', (qr) => {
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                return res.status(500).json({ error: 'Gagal menghasilkan QR code' });
            }
            res.json({ qrCodeUrl: url });
        });
    });
});

// Endpoint untuk mengirim pesan
app.get('/sendpesan', async (req, res) => {
    const { number, message } = req.query;

    if (!number || !message) {
        return res.status(400).json({ error: 'Parameter number dan message diperlukan' });
    }

    try {
        // Format nomor WhatsApp (harus diawali dengan kode negara)
        const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;

        // Kirim pesan
        const sendMessage = await client.sendMessage(formattedNumber, message);
        res.json({ success: true, messageId: sendMessage.id._serialized });
    } catch (error) {
        console.error('Gagal mengirim pesan:', error);
        res.status(500).json({ error: 'Gagal mengirim pesan' });
    }
});

// Jalankan server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});

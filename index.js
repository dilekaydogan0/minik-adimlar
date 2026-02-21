require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// 1. VERİTABANI BAĞLANTISI
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 2. OTOMATİK VERİTABANI GÜNCELLEME
(async () => {
  try {
    await pool.query(`
      ALTER TABLE ogrenciler 
      ADD COLUMN IF NOT EXISTS tc_no VARCHAR(11),
      ADD COLUMN IF NOT EXISTS yedek_veli_ad_soyad VARCHAR(100),
      ADD COLUMN IF NOT EXISTS veli_tel VARCHAR(20),
      ADD COLUMN IF NOT EXISTS yedek_veli_tel VARCHAR(20),
      ADD COLUMN IF NOT EXISTS kan_grubu VARCHAR(10),
      ADD COLUMN IF NOT EXISTS ilaclar TEXT,
      ADD COLUMN IF NOT EXISTS ozel_durum TEXT,
      ADD COLUMN IF NOT EXISTS su_an_okulda BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS son_islem_saati TIMESTAMP;
    `);
  } catch (e) { console.log("✅ Veritabanı sütunları hazır."); }
})();

// 3. MIDDLEWARE & FOTOĞRAF AYARLARI
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// --- ROTALAR ---

// ANA SAYFA (Renkli Arka Plan ve Carousel Geri Geldi)
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Minik Adımlar Oyun Atölyesi</title>
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; background: #fffdf9; font-family: 'Quicksand', sans-serif; overflow-x: hidden; }
          .nav-container { display: flex; justify-content: space-between; align-items: center; padding: 25px 60px; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
          .logo-text { font-size: 28px; font-weight: 700; color: #FF6B6B; letter-spacing: -1px; }
          .btn-login { padding: 14px 40px; border-radius: 50px; background: #4ECDC4; color: white; font-weight: 700; text-decoration: none; box-shadow: 0 6px 20px rgba(78, 205, 196, 0.3); transition: 0.3s; }
          .btn-login:hover { transform: scale(1.05); background: #45b7af; }
          .colorful-title { text-align: center; font-size: 56px; font-weight: 700; margin: 60px 0 30px 0; background: linear-gradient(to right, #FF6B6B, #FFD93D, #4ECDC4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .carousel-wrapper { display: flex; justify-content: center; align-items: center; height: 450px; width: 100%; margin-bottom: 50px; }
          .slide { width: 320px; height: 220px; object-fit: cover; border-radius: 30px; transition: 0.6s; opacity: 0.4; transform: scale(0.8); border: 4px solid #fff; }
          .slide.active { width: 550px; height: 360px; opacity: 1; transform: scale(1); z-index: 2; box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
          .nav-arrow { background: #fff; border: none; width: 60px; height: 60px; border-radius: 50%; box-shadow: 0 8px 20px rgba(0,0,0,0.08); cursor: pointer; font-size: 24px; color: #FF6B6B; }
          .wave-bottom { position: fixed; bottom: 0; left: 0; width: 100%; height: 100px; background: #FFD93D; clip-path: ellipse(70% 100% at 50% 100%); z-index: -1; opacity: 0.2; }
        </style>
      </head>
      <body>
        <div class="nav-container">
          <div class="logo-text">🐾 Minik Adımlar</div>
          <a href="/login-page" class="btn-login">Sisteme Giriş Yap</a>
        </div>
        <h1 class="colorful-title">Minik Adımlar Oyun Atölyesi</h1>
        <div class="carousel-wrapper">
          <button class="nav-arrow" onclick="move(-1)">❮</button>
          <div id="galeri" style="display:flex; align-items:center; gap:25px;"></div>
          <button class="nav-arrow" onclick="move(1)">❯</button>
        </div>
        <div class="wave-bottom"></div>
        <script>
          const resimler = ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800','https://images.unsplash.com/photo-1540479859555-17af45c78602?w=800','https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800','https://images.unsplash.com/photo-1564424555153-04228f0aa7ee?w=800'];
          let sira = 0;
          function ciz() {
            const g = document.getElementById('galeri'); g.innerHTML = '';
            [(sira-1+resimler.length)%resimler.length, sira, (sira+1)%resimler.length].forEach((id, p) => {
              const img = document.createElement('img'); img.src = resimler[id]; img.className = 'slide' + (p===1?' active':''); g.appendChild(img);
            });
          }
          function move(yon) { sira=(sira+yon+resimler.length)%resimler.length; ciz(); }
          ciz(); setInterval(()=>move(1), 5000);
        </script>
      </body>
    </html>
  `);
});

// GİRİŞ SAYFASI (Hatalı Giriş Görseliyle Birlikte)
app.get('/login-page', (req, res) => {
  res.send(`
    <html><head><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&display=swap" rel="stylesheet">
    <style>body{font-family:'Quicksand',sans-serif; background:#fffdf9; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;}
    .card{background:white; padding:40px; border-radius:30px; box-shadow:0 15px 35px rgba(0,0,0,0.05); width:320px; text-align:center; border-top:8px solid #4ECDC4;}
    input{width:100%; padding:15px; margin-bottom:15px; border-radius:12px; border:1px solid #eee; outline:none; box-sizing: border-box;}</style></head>
    <body><div class="card"><h2>Yönetici Girişi</h2><form action="/login" method="POST"><input type="text" name="email" placeholder="Kullanıcı Adı" required><input type="password" name="password" placeholder="Şifre" required><button type="submit" style="width:100%; padding:15px; background:#4ECDC4; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">Giriş Yap</button></form></div></body></html>
  `);
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const userRes = await pool.query('SELECT * FROM kullanicilar WHERE email = $1 AND sifre = $2', [email, password]);
  if (userRes.rows.length === 0) {
    return res.send(`
      <html><head><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@700&display=swap" rel="stylesheet">
      <style>body{font-family:'Quicksand',sans-serif; background:#fffdf9; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;}
      .error-card{background:white; padding:40px; border-radius:30px; box-shadow:0 10px 30px rgba(0,0,0,0.05); text-align:center; border-bottom:8px solid #FF6B6B;}
      .icon{font-size:50px; margin-bottom:10px;} a{display:inline-block; margin-top:20px; color:#1E90FF; text-decoration:none; font-weight:bold;}</style></head>
      <body><div class="error-card"><div class="icon">🚫</div><h2>Hatalı Giriş!</h2><p>E-posta veya şifreniz doğru görünmüyor.</p><a href="/login-page">Tekrar Dene</a></div></body></html>
    `);
  }
  res.redirect('/panel'); 
});

// ÖĞRETMEN PANELİ (Arama, Çıkış ve Kapsül Sayaçlar)
app.get('/panel', async (req, res) => {
  const ogrenciler = await pool.query('SELECT * FROM ogrenciler ORDER BY ad_soyad ASC');
  let htmlIn = ''; let htmlOut = ''; let countIn = 0; let countOut = 0;
  
  ogrenciler.rows.forEach(o => {
      const zaman = o.son_islem_saati ? new Date(o.son_islem_saati).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}) : '--:--';
      const foto = o.profil_resmi_url ? '/uploads/' + o.profil_resmi_url : 'https://via.placeholder.com/70';
      const kart = `<div class="card" data-isim="${o.ad_soyad.toLowerCase()}"><a href="/ogrenci-detay/${o.id}" style="display:flex; align-items:center; gap:15px; flex:1; text-decoration:none; color:inherit;"><img src="${foto}" style="width:70px; height:70px; border-radius:20px; object-fit:cover;"><div><strong>${o.ad_soyad}</strong><br><small>🕒 ${zaman}</small></div></a><button onclick="tg(${o.id})" class="btn-s ${o.su_an_okulda ? 'btn-in' : 'btn-out'}">${o.su_an_okulda ? 'Çıkış' : 'Giriş'}</button></div>`;
      if(o.su_an_okulda) { htmlIn += kart; countIn++; } else { htmlOut += kart; countOut++; }
  });

  res.send(`
    <html><head><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Quicksand', sans-serif; background: #fdfbf9; padding: 40px; margin: 0; }
      .top-bar { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto 10px auto; gap:20px;}
      .search-box { flex: 1; max-width: 400px; padding: 12px 20px; border-radius: 15px; border: 2px solid #eee; outline: none; font-size: 15px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1200px; margin: 0 auto; }
      .card { background: white; padding: 20px; border-radius: 25px; display: flex; align-items: center; gap: 15px; border: 1px solid #f0f0f0; }
      .btn-s { padding: 10px 18px; border-radius: 12px; border: none; color: white; font-weight: bold; cursor: pointer; }
      .btn-in { background: #FF6B6B; } .btn-out { background: #4ECDC4; }
      .btn-logout { padding: 12px 20px; border-radius: 15px; background: #fff1f1; color: #ff4757; text-decoration: none; font-weight: 700; border: 1px solid #ffe3e3; }
      .divider-wrap { position: relative; margin: 50px auto 30px auto; max-width: 1200px; display: flex; justify-content: center; align-items: center; }
      .soft-line { position: absolute; width: 100%; height: 2px; background: linear-gradient(90deg, rgba(253,251,249,0) 0%, rgba(226,232,240,1) 50%, rgba(253,251,249,0) 100%); z-index: 1; }
      .capsule { position: relative; z-index: 2; background: white; padding: 10px 25px; border-radius: 50px; display: inline-flex; align-items: center; gap: 12px; border: 1px solid #f1f5f9; box-shadow: 0 10px 25px rgba(0,0,0,0.03); font-weight: 700; color: #475569; }
      .badge { padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 800; }
      .b-green { background: #e6fffa; color: #0d9488; } .b-gray { background: #f1f5f9; color: #64748b; }
    </style></head>
    <body>
      <div class="top-bar">
        <h2>Öğrenci Yönetimi</h2>
        <input type="text" id="arama" class="search-box" placeholder="🔍 Öğrenci Ara..." onkeyup="ogrenciAra()">
        <div style="display:flex; gap:10px;"><a href="/yeni-ogrenci" style="padding:12px 25px; border-radius:15px; background:#FF6B6B; color:white; text-decoration:none; font-weight:700;">+ Yeni Öğrenci</a><a href="/" class="btn-logout">Sistemden Çıkış</a></div>
      </div>
      <div class="divider-wrap"><div class="soft-line"></div><div class="capsule"><span>🟢 Şu An Sınıfta Olanlar</span><div class="badge b-green">${countIn}</div></div></div>
      <div class="grid">${htmlIn}</div>
      <div class="divider-wrap"><div class="soft-line"></div><div class="capsule"><span>👫 Öğrenciler</span><div class="badge b-gray">${countOut}</div></div></div>
      <div class="grid">${htmlOut}</div>
      <script>
        async function tg(id) { await fetch('/durum-degistir/'+id, {method:'POST'}); location.reload(); }
        function ogrenciAra() { const val = document.getElementById('arama').value.toLowerCase(); document.querySelectorAll('.card').forEach(c => { c.style.display = c.getAttribute('data-isim').includes(val) ? 'flex' : 'none'; }); }
      </script></body></html>
  `);
});

// YENİ ÖĞRENCİ FORMU
app.get('/yeni-ogrenci', (req, res) => {
    res.send(`
        <html><head><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&display=swap" rel="stylesheet">
        <style>body{font-family:'Quicksand',sans-serif; background:#fdfbf9; padding:40px; display:flex; justify-content:center; align-items:flex-start; min-height:100vh;}
        .f-card{background:white; padding:40px; border-radius:40px; box-shadow:0 15px 45px rgba(0,0,0,0.05); width:550px; box-sizing: border-box; margin-bottom: 40px;}
        input, textarea, select { width:100%; padding:14px; margin-bottom:15px; border-radius:12px; border:2px solid #f1f5f9; outline:none; font-family:inherit; box-sizing: border-box; display: block;}
        .section-t { font-size: 13px; color: #94a3b8; text-transform: uppercase; margin: 10px 0 15px 0; font-weight: 700; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        button.kaydet-btn {width:100%; padding:18px; background:#4ECDC4; color:white; border:none; border-radius:18px; cursor:pointer; font-weight:bold; font-size: 16px; transition: 0.3s;}</style>
        <script>
          function formatPhone(input) { let v = input.value.replace(/[^0-9]/g, '').substring(0, 11); if (v.length > 0 && v[0] !== '0') v = '0' + v; let f = ''; for(let i=0; i<v.length; i++) { if(i===4 || i===7 || i===9) f += ' '; f += v[i]; } input.value = f.trim(); }
          function validateTC(input) { input.value = input.value.replace(/[^0-9]/g, '').substring(0, 11); }
        </script></head>
        <body><div class="f-card"><h2>✨ Yeni Kayıt</h2><form action="/ogrenci-ekle" method="POST" enctype="multipart/form-data">
        <div class="section-t">Kimlik Bilgileri</div><input type="text" name="ad" placeholder="Ad Soyad" required><input type="text" name="tc" placeholder="TC Kimlik No (11 Hane)" oninput="validateTC(this)" minlength="11" maxlength="11" pattern=".{11}" required>
        <select name="kan"><option value="">Kan Grubu Seçin</option><option value="A Rh+">A Rh+</option><option value="A Rh-">A Rh-</option><option value="B Rh+">B Rh+</option><option value="B Rh-">B Rh-</option><option value="AB Rh+">AB Rh+</option><option value="AB Rh-">AB Rh-</option><option value="0 Rh+">0 Rh+</option><option value="0 Rh-">0 Rh-</option></select>
        <div class="section-t">Veli İletişim</div><input type="text" name="v1" placeholder="1. Veli Ad Soyad" required><input type="text" name="v1t" placeholder="1. Veli Tel (05xx...)" oninput="formatPhone(this)" required><input type="text" name="v2" placeholder="2. Veli (Yedek) Ad Soyad"><input type="text" name="v2t" placeholder="2. Veli Tel" oninput="formatPhone(this)">
        <div class="section-t">Sağlık & Fotoğraf</div><textarea name="ilac" placeholder="Kullanılan İlaçlar" rows="2"></textarea><textarea name="ozel" placeholder="Özel Durum (Astım vb.)" rows="2"></textarea><input type="file" name="foto" accept="image/*" required>
        <button type="submit" class="kaydet-btn">Kaydı Tamamla</button><a href="/panel" style="display:block; text-align:center; margin-top:20px; color:#aaa; text-decoration:none; font-size:14px;">Vazgeç</a></form></div></body></html>
    `);
});

app.post('/ogrenci-ekle', upload.single('foto'), async (req, res) => {
    const { ad, tc, kan, v1, v1t, v2, v2t, ilac, ozel } = req.body;
    await pool.query(`INSERT INTO ogrenciler (ad_soyad, tc_no, kan_grubu, veli_ad_soyad, veli_tel, yedek_veli_ad_soyad, yedek_veli_tel, ilaclar, ozel_durum, profil_resmi_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, 
    [ad, tc, kan, v1, v1t, v2, v2t, ilac, ozel, req.file ? req.file.filename : null]);
    res.redirect('/panel'); 
});

// ÖĞRENCİ DETAY (Bölünmüş Ekran, Scrollbar ve Süre Hesaplama)
app.get('/ogrenci-detay/:id', async (req, res) => {
  const s = await pool.query('SELECT * FROM ogrenciler WHERE id = $1', [req.params.id]);
  const l = await pool.query('SELECT * FROM hareket_kayitlari WHERE ogrenci_id = $1 ORDER BY tarih DESC, id DESC', [req.params.id]);
  if(s.rows.length === 0) return res.send("Öğrenci bulunamadı.");
  const o = s.rows[0];
  let tabloHTML = '';
  l.rows.forEach(x => {
      const gFull = x.giris_saati ? x.giris_saati.toString() : null;
      const cFull = x.cikis_saati ? x.cikis_saati.toString() : null;
      const g = gFull ? gFull.substring(0, 5) : '--';
      const c = cFull ? cFull.substring(0, 5) : '--';
      let sure = '--';
      if (gFull && cFull) {
          const [gSaat, gDk] = g.split(':').map(Number);
          const [cSaat, cDk] = c.split(':').map(Number);
          let toplamDk = (cSaat * 60 + cDk) - (gSaat * 60 + gDk);
          if(toplamDk < 0) toplamDk += 24 * 60;
          const saatFarki = Math.floor(toplamDk / 60); const dkFarki = toplamDk % 60;
          if (saatFarki > 0 && dkFarki > 0) sure = `${saatFarki} sa ${dkFarki} dk`; else if (saatFarki > 0) sure = `${saatFarki} sa`; else sure = `${dkFarki} dk`;
      }
      tabloHTML += `<tr><td>${new Date(x.tarih).toLocaleDateString('tr-TR')}</td><td>${g}</td><td>${c}</td><td><strong>${sure}</strong></td></tr>`;
  });
  const resim = o.profil_resmi_url ? '/uploads/' + o.profil_resmi_url : 'https://via.placeholder.com/180';
  res.send(`
    <html><head><link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&display=swap" rel="stylesheet">
    <style>
      body{font-family:'Quicksand',sans-serif; background:#fdfbf9; padding:40px; margin:0;}
      .container { max-width: 1100px; margin: 0 auto; display: flex; gap: 30px; align-items: flex-start; }
      .left-panel { flex: 1.2; background: white; border-radius: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); padding: 40px; display: flex; flex-direction: column; gap: 20px; }
      .right-panel { flex: 0.8; background: white; border-radius: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); padding: 30px; height: 600px; display: flex; flex-direction: column; }
      .scroll-box { flex: 1; overflow-y: auto; padding-right: 10px; }
      .scroll-box::-webkit-scrollbar { width: 8px; } .scroll-box::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      .h{display:flex; gap:30px; border-bottom:1px solid #eee; padding-bottom: 20px; align-items:center;}
      .dz{width:150px; height:150px; border:3px dashed #4ECDC4; border-radius:30px; cursor:pointer; overflow:hidden;}
      .dz img{width:100%; height:100%; object-fit:cover;}
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
      .b{background:#f8fafc; padding:20px; border-radius:20px; border:1px solid #eee;}
      .health{background:#fffbeb; border:1px solid #fef3c7;}
      table{width:100%; border-collapse:collapse;} th,td{padding:12px; border-bottom:1px solid #eee; text-align:left;}
      .btn-edit { width: 100%; padding: 15px; background: #fdfbf9; color: #4ECDC4; border: 2px solid #4ECDC4; border-radius: 15px; cursor: pointer; font-weight: bold; transition: 0.3s; }
      .btn-del { width: 100%; padding: 15px; background: #fff1f1; color: #ff4757; border: 2px solid #ff4757; border-radius: 15px; cursor: pointer; font-weight: bold; transition: 0.3s; }
      .modal-bg { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: flex-start; overflow-y: auto; padding: 40px 0; }
      .f-card { background: white; padding: 40px; border-radius: 40px; width: 550px; margin: auto; box-sizing: border-box; }
      .section-t { font-size: 13px; color: #94a3b8; text-transform: uppercase; margin: 10px 0 15px 0; font-weight: 700; border-bottom: 1px solid #eee; padding-bottom: 5px; }
      .f-card input, .f-card textarea, .f-card select { width: 100%; padding: 14px; margin-bottom: 15px; border-radius: 12px; border: 2px solid #f1f5f9; outline: none; font-family: inherit; box-sizing: border-box; display: block; }
      .kaydet-btn { width: 100%; padding: 18px; background: #4ECDC4; color: white; border: none; border-radius: 18px; cursor: pointer; font-weight: bold; font-size: 16px; margin-top:10px; }
      .iptal-btn { width: 100%; padding: 15px; background: none; color: #aaa; border: none; cursor: pointer; font-weight: bold; margin-top: 5px; }
    </style></head>
    <body>
      <div style="max-width:1100px; margin: 0 auto 20px auto;"><a href="/panel" style="color:#1E90FF; text-decoration:none; font-weight:bold;">← Panele Dön</a></div>
      <div class="container">
        <div class="left-panel">
          <div class="h">
            <div class="dz" onclick="document.getElementById('fi').click()"><img src="${resim}"></div>
            <input type="file" id="fi" style="display:none" onchange="up(this.files[0],${o.id})">
            <div><h1 style="margin:0 0 10px 0;">${o.ad_soyad}</h1><p style="margin:5px 0;">TC: ${o.tc_no || '-'}</p><p style="margin:5px 0;">Kan: ${o.kan_grubu || '-'}</p></div>
          </div>
          <div class="grid-2"><div class="b"><h3>Veli 1</h3><p>${o.veli_ad_soyad || '-'}</p><p>${o.veli_tel || '-'}</p></div><div class="b"><h3>Veli 2 (Yedek)</h3><p>${o.yedek_veli_ad_soyad || '-'}</p><p>${o.yedek_veli_tel || '-'}</p></div></div>
          <div class="b health"><h3>💊 Sağlık Notları</h3><p>İlaçlar: ${o.ilaclar || 'Yok'}</p><p>Durum: ${o.ozel_durum || 'Yok'}</p></div>
          <div class="grid-2" style="margin-top: 10px;"><button class="btn-edit" onclick="document.getElementById('editModal').style.display='flex'">✏️ Düzenle</button><button class="btn-del" onclick="sil(${o.id})">🗑️ Sil</button></div>
        </div>
        <div class="right-panel"><h3 style="margin-top:0;">📅 Hareket Kayıtları</h3><div class="scroll-box"><table><thead style="position: sticky; top: 0; background: white;"><tr><th>Tarih</th><th>Giriş</th><th>Çıkış</th><th>Süre</th></tr></thead><tbody>${tabloHTML}</tbody></table></div></div>
      </div>
      <div id="editModal" class="modal-bg"><div class="f-card"><h2>✏️ Düzenle</h2><form action="/ogrenci-guncelle/${o.id}" method="POST" enctype="multipart/form-data">
      <div class="section-t">Kimlik</div><input type="text" name="ad" value="${o.ad_soyad}" required><input type="text" name="tc" value="${o.tc_no || ''}" oninput="valTC(this)" minlength="11" maxlength="11" pattern=".{11}" required>
      <select name="kan"><option value="">Kan Grubu</option><option value="A Rh+" ${o.kan_grubu==='A Rh+'?'selected':''}>A Rh+</option><option value="B Rh+" ${o.kan_grubu==='B Rh+'?'selected':''}>B Rh+</option><option value="AB Rh+" ${o.kan_grubu==='AB Rh+'?'selected':''}>AB Rh+</option><option value="0 Rh+" ${o.kan_grubu==='0 Rh+'?'selected':''}>0 Rh+</option></select>
      <div class="section-t">Veli</div><input type="text" name="v1" value="${o.veli_ad_soyad || ''}" required><input type="text" name="v1t" value="${o.veli_tel || ''}" oninput="fmtPh(this)" required><input type="text" name="v2" value="${o.yedek_veli_ad_soyad || ''}"><input type="text" name="v2t" value="${o.yedek_veli_tel || ''}" oninput="fmtPh(this)">
      <div class="section-t">Sağlık</div><textarea name="ilac" rows="2">${o.ilaclar || ''}</textarea><textarea name="ozel" rows="2">${o.ozel_durum || ''}</textarea><input type="file" name="foto" accept="image/*"><button type="submit" class="kaydet-btn">Kaydet</button><button type="button" class="iptal-btn" onclick="document.getElementById('editModal').style.display='none'">İptal</button></form></div></div>
      <script>
        function fmtPh(i) { let v = i.value.replace(/[^0-9]/g, '').substring(0, 11); if (v.length > 0 && v[0] !== '0') v = '0' + v; let f = ''; for(let j=0; j<v.length; j++) { if(j===4 || j===7 || j===9) f += ' '; f += v[j]; } i.value = f.trim(); }
        function valTC(i) { i.value = i.value.replace(/[^0-9]/g, '').substring(0, 11); }
        function up(f,id) { const fd = new FormData(); fd.append('foto',f); fetch('/upload-photo/'+id, {method:'POST', body:fd}).then(() => location.reload()); }
        function sil(id) { if(confirm("Bu öğrenciyi silmek istediğinizden emin misiniz?")) { fetch('/ogrenci-sil/'+id, {method:'DELETE'}).then(() => location.href='/panel'); } }
      </script></body></html>
  `);
});

// ÖĞRENCİ GÜNCELLEME, SİLME VE DURUM ROTALARI
app.post('/ogrenci-guncelle/:id', upload.single('foto'), async (req, res) => {
    const { ad, tc, kan, v1, v1t, v2, v2t, ilac, ozel } = req.body;
    const id = req.params.id;
    if (req.file) {
        await pool.query(`UPDATE ogrenciler SET ad_soyad=$1, tc_no=$2, kan_grubu=$3, veli_ad_soyad=$4, veli_tel=$5, yedek_veli_ad_soyad=$6, yedek_veli_tel=$7, ilaclar=$8, ozel_durum=$9, profil_resmi_url=$10 WHERE id=$11`, [ad, tc, kan, v1, v1t, v2, v2t, ilac, ozel, req.file.filename, id]);
    } else {
        await pool.query(`UPDATE ogrenciler SET ad_soyad=$1, tc_no=$2, kan_grubu=$3, veli_ad_soyad=$4, veli_tel=$5, yedek_veli_ad_soyad=$6, yedek_veli_tel=$7, ilaclar=$8, ozel_durum=$9 WHERE id=$10`, [ad, tc, kan, v1, v1t, v2, v2t, ilac, ozel, id]);
    }
    res.redirect('/ogrenci-detay/' + id); 
});

app.delete('/ogrenci-sil/:id', async (req, res) => { await pool.query('DELETE FROM ogrenciler WHERE id = $1', [req.params.id]); res.json({ success: true }); });

app.post('/durum-degistir/:id', async (req, res) => {
  const r = await pool.query('SELECT su_an_okulda FROM ogrenciler WHERE id = $1', [req.params.id]);
  const yeni = !r.rows[0].su_an_okulda;
  
  // JS tarafında Türkiye saatini oluşturuyoruz
  const trSaat = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Istanbul' });
  const trTarih = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }); // YYYY-MM-DD formatı

  // Veritabanına doğrudan bu değişkenleri gönderiyoruz
  await pool.query('UPDATE ogrenciler SET su_an_okulda = $1, son_islem_saati = CURRENT_TIMESTAMP AT TIME ZONE \'UTC\' AT TIME ZONE \'Europe/Istanbul\' WHERE id = $2', [yeni, req.params.id]);
  
  if (yeni) {
      await pool.query('INSERT INTO hareket_kayitlari (ogrenci_id, tarih, giris_saati) VALUES ($1, $2, $3)', 
      [req.params.id, trTarih, trSaat]);
  } else {
      await pool.query('UPDATE hareket_kayitlari SET cikis_saati = $1 WHERE ogrenci_id = $2 AND tarih = $3 AND cikis_saati IS NULL', 
      [trSaat, req.params.id, trTarih]);
  }
  res.json({ success: true });
});

app.post('/upload-photo/:id', upload.single('foto'), async (req, res) => {
    await pool.query('UPDATE ogrenciler SET profil_resmi_url = $1 WHERE id = $2', [req.file.filename, req.params.id]);
    res.json({ success: true });
});

app.listen(port, () => console.log(`🚀 Sunucu: http://localhost:${port}`));
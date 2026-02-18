# Proje Dağıtım Rehberi (GitHub & Vercel)

Bu rehber, projenizi GitHub'a yükleyip Vercel üzerinden **ücretsiz** ve **kotaya takılmadan** yayınlamanız için hazırlanmıştır.

## ⚠️ Kritik Uyarı: Bandwidth (Bant Genişliği)
Bu projede yaptığımız **"Manifest-Only Proxy"** optimizasyonu sayesinde, video verileri (Gigabytelar) Vercel sunucusundan **akmaz**. 
- **Vercel Sunucusu**: Sadece küçük metin dosyalarını (m3u8 oynatma listeleri) işler.
- **Kullanıcı (TV)**: Video parçalarını direkt olarak Kick'ten çeker.
Bu sayede Vercel'in 100GB'lık ücretsiz kotası dolmaz.

---

## 1. Adım: GitHub Hesabı ve Depo (Repository) Oluşturma

1. **[github.com](https://github.com)** adresine gidin ve (yoksa) ücretsiz bir hesap oluşturun.
2. Sağ üstteki **+** ikonuna tıklayıp **"New repository"** seçeneğini seçin.
3. **Repository name** kısmına bir isim verin (Örn: `kick-tv-player`).
4. **Public** seçeneğini seçin (Ücretsiz plan için Public olması daha iyidir).
5. "Initialize this repository with..." seçeneklerinin **hepsini boş bırakın**.
6. **"Create repository"** butonuna tıklayın.

---

## 2. Adım: Kodları GitHub'a Yükleme

Bilgisayarınızdaki proje klasöründe terminali açın (VS Code terminali uygundur) ve şu komutları sırasıyla yazın:

```bash
# 1. Git'i başlatın (Eğer daha önce yapmadıysanız)
git init

# 2. Tüm dosyaları ekleyin
git add .

# 3. İlk kaydı oluşturun
git commit -m "İlk dağıtım: Kick TV Player v1.0"

# 4. Ana dalı 'main' olarak adlandırın
git branch -M main

# 5. Uzak depoyu ekleyin (LINK_ADRESI yerine oluşturduğunuz repo linkini yapıştırın)
# Örnek: git remote add origin https://github.com/KULLANICI_ADI/kick-tv-player.git
# NOT: Kendi kullanıcı adınızı ve repo adınızı doğru yazdığınızdan emin olun.
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git

# 6. Kodları gönderin
git push -u origin main
```

*(Not: Eğer ilk defa git kullanıyorsanız, kullanıcı adı ve şifre (token) sorabilir.)*

---

## 3. Adım: Vercel'de Yayınlama

1. **[vercel.com](https://vercel.com)** adresine gidin ve "Sign Up" diyerek **GitHub ile giriş yapın**.
2. Dashboard (Ana ekran) açılınca **"Add New..."** -> **"Project"** butonuna tıklayın.
3. Sol tarafta GitHub hesabınızdaki `kick-tv-player` deposunu göreceksiniz. Yanındaki **"Import"** butonuna tıklayın.
4. **Configure Project** ekranında:
   - **Framework Preset**: `Next.js` (Otomatik seçili olmalı).
   - **Root Directory**: `./` (Değiştirmeyin).
   - **Build Command**: `next build` (Otomatik).
   - **Install Command**: `npm install` (Otomatik).
5. **Deploy** butonuna tıklayın.

Ortalama 1-2 dakika içinde site derlenecek ve yayına alınacaktır. Ekranda konfetiler patladığında size bir link (örn: `kick-tv-player.vercel.app`) verecek.

---

## 4. Adım: TV'de Test Etme

1. Vercel'in verdiği linki kopyalayın.
2. Philips TV tarayıcısını açın.
3. Adresi çubuğuna linki yazın.
4. Bir yayına girip test edin.

**İyi seyirler!**

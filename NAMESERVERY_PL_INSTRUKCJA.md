# ⚠️ WYMAGANE: Aktualizacja Nameserverów dla arkuszowniasmb.pl

## 🎯 CO MUSISZ ZROBIĆ TERAZ

Aby domena **arkuszowniasmb.pl** działała, musisz zaktualizować nameservery u swojego rejestratora.

---

## 📋 Krok po Kroku (5 minut)

### 1️⃣ ZNAJDŹ SWOJE NAMESERVERY CLOUDFLARE

**Opcja A: Panel Cloudflare**
1. Wejdź na: https://dash.cloudflare.com
2. Zaloguj się
3. Kliknij domenę `arkuszowniasmb.pl`
4. Sekcja **"Nameservers"** - zobaczysz 2 nameservery
5. **Zapisz je** (wyglądają jak: `xxx.ns.cloudflare.com`)

**Opcja B: Email**
- Cloudflare wysłał email do `lukasz.rohan@gmail.com`
- Znajdź w emailu sekcję z nameserverami

---

### 2️⃣ ZALOGUJ SIĘ DO REJESTRATORA

Gdzie kupiłeś domenę **arkuszowniasmb.pl**?

**Popularne polskie rejestry:**
- **OVH.pl** → https://www.ovh.pl/manager/
- **home.pl** → https://panel.home.pl/
- **nazwa.pl** → https://panel.nazwa.pl/
- **aftermarket.pl** → https://www.aftermarket.pl/panel/

**Nie pamiętasz?**
- Sprawdź w emailu potwierdzenie zakupu domeny
- Lub sprawdź: https://www.whois.com/whois/arkuszowniasmb.pl

---

### 3️⃣ WYŁĄCZ DNSSEC (jeśli włączone)

**Ważne:** To musi być zrobione PRZED zmianą nameserverów!

1. Znajdź ustawienia DNS dla `arkuszowniasmb.pl`
2. Szukaj opcji "DNSSEC"
3. Jeśli jest włączone - **wyłącz**
4. Zapisz zmiany

---

### 4️⃣ ZMIEŃ NAMESERVERY

**Znajdź sekcję:**
- "Nameservery" / "Serwery nazw"
- "DNS Settings" / "Ustawienia DNS"
- "Zarządzaj DNS"

**Wykonaj:**

A. Wybierz **"Własne nameservery"** / **"Custom nameservers"**

B. **Usuń** istniejące nameservery

C. **Dodaj** oba nameservery Cloudflare (z kroku 1)

D. **ZAPISZ** zmiany

---

## 📖 Instrukcje dla Konkretnych Rejestratorów

### OVH.pl (Szczegółowo):

1. Wejdź: https://www.ovh.pl/manager/
2. Zaloguj się
3. Znajdź domenę: `arkuszowniasmb.pl`
4. Kliknij domenę
5. Przejdź do zakładki **"Serwery DNS"**
6. Kliknij **"Zmień serwery DNS"**
7. Wybierz **"Użyj innych serwerów DNS"**
8. W polu **"Serwer DNS 1"** wpisz pierwszy nameserver Cloudflare
9. W polu **"Serwer DNS 2"** wpisz drugi nameserver Cloudflare
10. Kliknij **"Zatwierdź"**
11. Potwierdź zmiany

### home.pl (Szczegółowo) - TUTAJ MASZ DOMENĘ!

**DOKŁADNA INSTRUKCJA DLA TWOJEGO PANELU:**

#### Krok 1: Jesteś już w panelu - świetnie!
Widzę że jesteś na stronie domeny `arkuszowniasmb.pl` w panelu home.pl

#### Krok 2: Kliknij "DZIAŁANIA" (niebieski przycisk)
- Znajduje się w sekcji **"Hosting DNS"** (pierwsza sekcja u góry)
- Pod napisem "Provider Name Servers" są wymienione:
  - dns.home.pl
  - dns2.home.pl
  - dns3.home.pl

#### Krok 3: Wybierz "Zmień serwery DNS"
W menu które się otworzy po kliknięciu "DZIAŁANIA"

#### Krok 4: Znajdź opcję "Zewnętrzne serwery DNS"
Powinna być opcja do wyboru między:
- **Serwery home.pl** (domyślne - aktualnie aktywne)
- **Zewnętrzne serwery DNS** ← WYBIERZ TO!

#### Krok 5: Wpisz nameservery Cloudflare
Po wybraniu "Zewnętrzne serwery DNS" zobaczysz pola:

**WAŻNE: Najpierw musisz WYŁĄCZYĆ DNSSEC!**

**Zobacz na dole strony - sekcja "DNSSec":**
- Widzę że DNSSec jest **włączone** (zielone ✓)
- **NAJPIERW kliknij "WŁĄCZ" aby go WYŁĄCZYĆ**
- Poczekaj aż się zmieni na wyłączone

**DOPIERO POTEM wróć do nameserverów:**

- **NS1 (Name Server 1):** wpisz pierwszy nameserver z Cloudflare
- **NS2 (Name Server 2):** wpisz drugi nameserver z Cloudflare
- Możesz dodać więcej jeśli Cloudflare dał więcej

#### Krok 6: Zapisz zmiany
Kliknij przycisk "Zapisz" lub "Zatwierdź"

---

## 🔍 GDZIE ZNALEŹĆ NAMESERVERY CLOUDFLARE?

### W Pierwszym Screenshocie (Cloudflare):
Widzę że pokazuje:
```
boyd.ns.cloudflare.com
reza.ns.cloudflare.com
```

**ALE TO SĄ NAMESERVERY DLA .COM!**

### Dla arkuszowniasmb.pl Twoje Nameservery Będą INNE!

**Sprawdź tutaj:**
1. Wejdź na: https://dash.cloudflare.com
2. Zaloguj się
3. Znajdź domenę **arkuszowniasmb.pl** (nie .com!)
4. Kliknij na nią
5. Zobacz sekcję "Nameservers" - tam będą 2 nameservery
6. **UŻYJ TYCH nameserwerów** (nie tych z .com!)

---

## ⚠️ BARDZO WAŻNE - KOLEJNOŚĆ:

### 1. WYŁĄCZ DNSSec (NAJPIERW!)
- Na dole strony w home.pl
- Sekcja "DNSSec"  
- Kliknij "WŁĄCZ" aby wyłączyć (tak, to jest dziwne ale tak działa)
- Poczekaj na potwierdzenie

### 2. ZMIEŃ NAMESERVERY (POTEM!)
- Kliknij "DZIAŁANIA" w sekcji Hosting DNS
- Wybierz zewnętrzne serwery DNS
- Wpisz oba nameservery Cloudflare DLA .PL
- Zapisz

---

## 📸 CO WIDZISZ NA SWOIM EKRANIE:

**Sekcja "Hosting DNS":**
- Provider Name Servers: dns.home.pl, dns2.home.pl, dns3.home.pl
- **Przycisk "DZIAŁANIA"** ← KLIKNIJ TUTAJ

**Sekcja "DNSSec" (na dole):**
- Status: Włączone (zielone)
- **Link "Włącz o DNSSec"** ← KLIKNIJ TUTAJ NAJPIERW aby wyłączyć

---

## 🎯 TWOJE KONKRETNE KROKI:

```
KROK 1: Wyłącz DNSSec
   └─ Przewiń na dół strony
   └─ Znajdź sekcję "DNSSec"  
   └─ Kliknij link/przycisk aby wyłączyć
   └─ Poczekaj na potwierdzenie

KROK 2: Znajdź Cloudflare nameservery dla .PL
   └─ https://dash.cloudflare.com
   └─ Domena: arkuszowniasmb.pl
   └─ Zapisz oba nameservery

KROK 3: Zmień nameservery w home.pl
   └─ Kliknij "DZIAŁANIA" (niebieski przycisk)
   └─ Wybierz "Zewnętrzne serwery DNS"
   └─ Wpisz oba nameservery Cloudflare
   └─ Zapisz
```

---

### nazwa.pl (Szczegółowo):

1. Wejdź: https://panel.nazwa.pl/
2. Zaloguj się
3. **"Moje domeny"**
4. Kliknij `arkuszowniasmb.pl`
5. **"Zarządzaj"** → **"Zmień DNS"**
6. Wybierz **"Własne serwery DNS"**
7. Wpisz oba nameservery Cloudflare
8. **"Zapisz"**

---

## ⏰ Co Się Stanie Potem?

### Natychmiast po zapisaniu:
- ✅ Zmiany są wysłane do rejestracji

### Po 15 minutach - 24 godzinach (zazwyczaj 1-2 godziny):
- ✅ DNS się propaguje
- ✅ Cloudflare aktywuje domenę
- ✅ Otrzymasz email potwierdzający

### Kiedy będzie gotowe:
- ✅ https://arkuszowniasmb.pl będzie działać
- ✅ HTTPS będzie automatycznie włączone
- ✅ Cloudflare ochrona będzie aktywna

---

## 🔍 Jak Sprawdzić Postęp?

### Metoda 1: Sprawdź DNS
```powershell
nslookup -type=NS arkuszowniasmb.pl
```

Powinieneś zobaczyć nameservery Cloudflare.

### Metoda 2: Online Tool
Wejdź: https://dnschecker.org/

Wpisz: `arkuszowniasmb.pl`

Szukaj: Twoich nameserverów Cloudflare w rekordach NS

### Metoda 3: Panel Cloudflare
- Zaloguj się na https://dash.cloudflare.com
- Sprawdź status domeny `arkuszowniasmb.pl`
- Status zmieni się z "Pending" na "Active"

---

## 🚀 Tymczasem: Przetestuj Lokalnie

Podczas oczekiwania na propagację DNS:

### Uruchom Aplikację
```powershell
start-arkuszownia-pl.cmd
```

### Dostęp Lokalny
- http://localhost (na Twoim komputerze)
- Wszystko jest gotowe, czeka tylko DNS!

---

## ✅ Checklist

```
[ ] Znalazłem nameservery Cloudflare (w panelu lub emailu)
[ ] Zapisałem oba nameservery
[ ] Zalogowałem się do rejestratora
[ ] Znalazłem ustawienia DNS dla arkuszowniasmb.pl
[ ] Wyłączyłem DNSSEC (jeśli było włączone)
[ ] Zmieniłem nameservery na Cloudflare
[ ] Zapisałem zmiany
[ ] Czekam na potwierdzenie email
```

---

## 🆘 Problemy?

### Nie mogę znaleźć rejestratora
- Sprawdź: https://www.whois.com/whois/arkuszowniasmb.pl
- Sekcja "Registrar:" powie Ci gdzie jest domena

### Nie mam dostępu do panelu
- Użyj "Przypomnij hasło" na stronie rejestratora
- Sprawdź email z danymi logowania
- Zadzwoń do supportu rejestratora

### DNSSEC nie da się wyłączyć
- Skontaktuj się z supportem rejestratora
- Poproś ich o wyłączenie DNSSEC dla Twojej domeny

### Nameservery się nie zmieniają
- Sprawdź czy na pewno zapisałeś zmiany
- Poczekaj dłużej (do 24h)
- Skontaktuj się z supportem rejestratora

---

## 📧 Email Potwierdzający

Otrzymasz email od Cloudflare na: **lukasz.rohan@gmail.com**

Email będzie zawierał:
- ✅ Potwierdzenie że arkuszowniasmb.pl jest aktywna
- ✅ Link do panelu Cloudflare
- ✅ Informacje o następnych krokach

---

## 🎯 Podsumowanie

**Cloudflare:** ✅ Gotowe  
**Tunel:** ✅ Skonfigurowany  
**DNS w Cloudflare:** ✅ Ustawione  
**Twoja aplikacja:** ✅ Działa lokalnie  

**BRAKUJE:** ⏳ Aktualizacja nameserwerów u rejestratora

**PO AKTUALIZACJI:** 🎉 Strona będzie live na https://arkuszowniasmb.pl

---

## 💡 Wskazówka

**Powiedz rejestratorowi:**

> "Witam, chcę zmienić nameservery dla mojej domeny arkuszowniasmb.pl 
> na nameservery Cloudflare. Proszę o pomoc w zmianie i wyłączenie DNSSEC."

Podaj im nameservery Cloudflare i support pomoże Ci przez cały proces!

---

**NASTĘPNY KROK:** Zaktualizuj nameservery u rejestratora TERAZ! ⏰

Po wykonaniu tego kroku, Twoja strona będzie dostępna publicznie! 🚀


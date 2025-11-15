# 🎯 SZYBKI PRZEWODNIK: Nameservery w home.pl

## Widzę Twój Panel! Oto Dokładnie Co Zrobić:

---

## KROK 1: WYŁĄCZ DNSSec (NAJPIERW!)

### Gdzie to znajdziesz:
- **Przewiń NA DÓŁ** strony gdzie jesteś teraz
- Znajdź sekcję **"DNSSec"**
- Widzę że jest tam napis "DNSSec: Wyłączone" lub "Włączone"

### Co zrobić:
1. Jeśli jest **Włączone** (✓):
   - Kliknij link "Włącz o DNSSec" lub przycisk obok
   - To go WYŁĄCZY (tak, nazwa jest myląca)
   - Poczekaj na komunikat potwierdzenia

2. Jeśli już jest **Wyłączone**:
   - Super! Przejdź do Kroku 2

---

## KROK 2: ZNAJDŹ NAMESERVERY CLOUDFLARE

### Gdzie sprawdzić:
1. Otwórz nową kartę przeglądarki
2. Wejdź: **https://dash.cloudflare.com**
3. Zaloguj się
4. Znajdź domenę **arkuszowniasmb.pl**
5. Kliknij na nią
6. Szukaj sekcji **"Nameservers"**

### Zapisz oba nameservery:
```
Przykład (Twoje będą inne):
xxxxx.ns.cloudflare.com
yyyyy.ns.cloudflare.com
```

**⚠️ NIE używaj tych z .com! To inne nameservery!**

---

## KROK 3: ZMIEŃ NAMESERVERY W home.pl

### Na stronie gdzie jesteś teraz:

#### A. Znajdź sekcję "Hosting DNS" (u góry)
Tam gdzie napisane:
```
Provider Name Servers
dns.home.pl
dns2.home.pl
dns3.home.pl
```

#### B. Kliknij niebieski przycisk **"DZIAŁANIA"**
Jest po prawej stronie tej sekcji.

#### C. W menu wybierz:
- **"Zmień serwery DNS"** lub
- **"Zewnętrzne serwery DNS"** lub  
- **"Własne serwery nazw"**

#### D. Zobaczysz pola do wpisania:
- **NS1** lub **Nameserver 1**: wpisz pierwszy nameserver Cloudflare
- **NS2** lub **Nameserver 2**: wpisz drugi nameserver Cloudflare

#### E. Kliknij **"ZAPISZ"** lub **"ZATWIERDŹ"**

---

## ✅ CHECKLIST

```
[ ] Wyłączyłem DNSSec (sekcja na dole strony)
[ ] Znalazłem nameservery Cloudflare dla arkuszowniasmb.pl
[ ] Zapisałem oba nameservery
[ ] Kliknąłem "DZIAŁANIA" w sekcji Hosting DNS
[ ] Wybrałem zewnętrzne/własne serwery DNS
[ ] Wpisałem oba nameservery Cloudflare
[ ] Kliknąłem ZAPISZ
[ ] Zobaczyłem potwierdzenie
```

---

## 🎯 WIZUALIZACJA TWOJEGO PANELU:

```
┌─────────────────────────────────────────────┐
│  Domena arkuszowniasmb.pl                   │
├─────────────────────────────────────────────┤
│                                             │
│  📌 Hosting DNS          🔵 DZIAŁANIA ← KLIKNIJ!
│     Provider Name Servers                   │
│     • dns.home.pl                          │
│     • dns2.home.pl                         │
│     • dns3.home.pl                         │
│                                             │
├─────────────────────────────────────────────┤
│  ... inne sekcje ...                        │
├─────────────────────────────────────────────┤
│                                             │
│  📌 DNSSec                                  │
│     Status: Włączone ✓  [Link] ← KLIKNIJ NAJPIERW!
│     (aby wyłączyć)                         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ⏰ CO SIĘ STANIE:

### Natychmiast:
- Zobaczysz potwierdzenie zapisania zmian
- home.pl wyśle zmiany do rejestracji

### Po 1-2 godzinach (max 24h):
- DNS się propaguje
- Cloudflare aktywuje domenę
- Dostaniesz email od Cloudflare

### Kiedy będzie gotowe:
- https://arkuszowniasmb.pl zacznie działać
- HTTPS będzie automatyczne
- Możesz uruchomić: `start-arkuszownia-pl.cmd`

---

## 🆘 JEŚLI COŚ NIE DZIAŁA:

### Nie widzę przycisku "DZIAŁANIA"
- Odśwież stronę (F5)
- Lub szukaj menu "Zarządzaj DNS" / "Ustawienia DNS"

### Nie mogę znaleźć "Zewnętrzne serwery DNS"
- Po kliknięciu DZIAŁANIA może być napisane:
  - "Zmień serwery DNS"
  - "Użyj własnych serwerów"
  - "Custom nameservers"
- Kliknij którykolwiek z tych

### DNSSec nie chce się wyłączyć
- Zadzwoń do supportu home.pl: 19 351 lub 12 297 88 00
- Powiedz: "Chcę wyłączyć DNSSec dla arkuszowniasmb.pl aby zmienić nameservery na Cloudflare"

---

## 📞 SUPPORT home.pl

**Telefon:** 19 351 lub +48 12 297 88 00  
**Email:** bok@home.pl  
**Live Chat:** panel.home.pl (prawy dolny róg)

**Co powiedzieć:**
> "Dzień dobry, chcę zmienić nameservery dla mojej domeny arkuszowniasmb.pl 
> na zewnętrzne serwery Cloudflare. Potrzebuję wyłączyć DNSSec i ustawić 
> własne nameservery."

---

## 🎉 PO WYKONANIU:

Wróć tutaj i uruchom:
```
start-arkuszownia-pl.cmd
```

Poczekaj na email od Cloudflare, a potem Twoja strona będzie live! 🚀

---

**PAMIĘTAJ:**
1. NAJPIERW wyłącz DNSSec (dół strony)
2. POTEM zmień nameservery (przycisk DZIAŁANIA)
3. Użyj nameserwerów DLA .PL (nie .com!)

**Powodzenia! 💪**


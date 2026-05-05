# Instrukcja prezentacji testów Selenium

Ten dokument opisuje, jak przygotować i zaprezentować testy E2E Selenium dla aplikacji Virtual Wallet.

## 1. Co pokazują testy

Testy Selenium uruchamiają aplikację w prawdziwej przeglądarce Chrome i wykonują akcje tak, jak użytkownik:

- wejście na stronę główną i przekierowanie do logowania,
- walidację formularzy logowania i rejestracji,
- logowanie oraz wylogowanie z konta testowego,
- zwijanie panelu bocznego i zapis stanu w `localStorage`,
- dodanie, edycję, filtrowanie i usunięcie transakcji,
- walidację niepoprawnych kwot transakcji,
- dodanie i usunięcie kilku tymczasowych transakcji,
- dodanie kilku transakcji śladowych z opisami `Selenium trace ...`,
- zapis preferencji użytkownika w ustawieniach.

Główny plik testów:

```text
tests/e2e/virtual-wallet.test.js
```

Helpery:

```text
tests/e2e/helpers/appServer.js
tests/e2e/helpers/browser.js
tests/e2e/helpers/auth.js
```

## 2. Przygotowanie przed zajęciami

1. Zainstaluj zależności:

```bash
npm install
```

2. Upewnij się, że na komputerze jest zainstalowany Chrome albo Chromium.

3. Skopiuj `.env.example` do `.env`:

```bash
cp .env.example .env
```

4. Uzupełnij w `.env` konfigurację Firebase:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Dodaj w `.env` dane konta testowego:

```bash
E2E_TEST_EMAIL=adres-konta-testowego@example.com
E2E_TEST_PASSWORD=haslo-konta-testowego
```

Bez tych dwóch zmiennych uruchomią się tylko testy publiczne, a testy po zalogowaniu zostaną pominięte.

6. Opcjonalnie przygotuj przykładowe transakcje:

```bash
node server/seedMockTransactions.js adres-konta-testowego@example.com
```

## 3. Próba techniczna przed prezentacją

Najpierw uruchom testy w trybie headless:

```bash
npm run test:e2e
```

Oczekiwany wynik przy ustawionym koncie testowym:

```text
tests 9
pass 9
fail 0
```

Jeżeli nie ustawisz `E2E_TEST_EMAIL` i `E2E_TEST_PASSWORD`, poprawny wynik będzie wyglądał tak:

```text
tests 9
pass 2
skipped 7
fail 0
```

Uwaga: jeden test celowo zostawia po sobie transakcje z opisami zaczynającymi się od `Selenium trace`. Dzięki temu po prezentacji widać na koncie testowym, że Selenium faktycznie dodawało dane.

## 4. Prezentacja na zajęciach

### Krok 1: Pokaż skrypty w `package.json`

W pliku `package.json` pokaż:

```json
"test:e2e": "node --test --test-concurrency=1 tests/e2e/*.test.js",
"test:e2e:headed": "E2E_HEADLESS=false node --test --test-concurrency=1 tests/e2e/*.test.js"
```

Wyjaśnienie:

- `test:e2e` uruchamia testy automatycznie w tle,
- `test:e2e:headed` pokazuje widoczne okno przeglądarki,
- `--test-concurrency=1` uruchamia testy po kolei, żeby scenariusze nie kolidowały ze sobą.

### Krok 2: Pokaż strukturę testów

Pokaż katalog:

```text
tests/e2e/
```

Powiedz krótko:

- `virtual-wallet.test.js` zawiera scenariusze testowe,
- `appServer.js` uruchamia lokalny frontend Vite i zamyka go po testach,
- `browser.js` tworzy przeglądarkę Chrome i udostępnia helpery Selenium,
- `auth.js` loguje użytkownika testowego.

### Krok 3: Uruchom test z widoczną przeglądarką

Uruchom:

```bash
npm run test:e2e:headed
```

Podczas działania testów zwróć uwagę, że Selenium:

- otwiera prawdziwą aplikację,
- wpisuje dane w formularze,
- klika przyciski,
- przechodzi między podstronami,
- sprawdza teksty i stan interfejsu,
- potwierdza alert usunięcia transakcji,
- zostawia widoczne transakcje śladowe z opisami `Selenium trace ...`.

### Krok 4: Pokaż wynik w terminalu

Po zakończeniu pokaż podsumowanie:

```text
pass 9
fail 0
```

Jeżeli testy po zalogowaniu są pominięte, pokaż, że jest to kontrolowane przez brak danych konta testowego w `.env`.

## 5. Krótki opis do powiedzenia prowadzącemu

Możesz powiedzieć:

> To są testy E2E napisane w Selenium WebDriver. Nie testują pojedynczych funkcji w izolacji, tylko uruchamiają całą aplikację w przeglądarce i przechodzą przez realne akcje użytkownika. Dzięki temu sprawdzają, czy routing, formularze, Firebase, transakcje, ustawienia i interfejs działają razem. Do elementów używam selektorów `data-testid`, żeby testy nie zależały od klas CSS ani od wyglądu strony.

## 6. Najczęstsze problemy

### Testy po zalogowaniu są pominięte

Sprawdź, czy w `.env` są ustawione:

```bash
E2E_TEST_EMAIL=...
E2E_TEST_PASSWORD=...
```

### Aplikacja nie startuje

Sprawdź wymagane zmienne Firebase:

```bash
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Chrome się nie uruchamia

Zainstaluj Chrome albo Chromium i uruchom test ponownie:

```bash
npm run test:e2e:headed
```

### Port `5173` jest zajęty

Uruchom aplikację na innym porcie i ustaw adres w `.env`:

```bash
E2E_BASE_URL=http://localhost:5174
```

## 7. Komendy do szybkiego użycia

Headless:

```bash
npm run test:e2e
```

Widoczna przeglądarka:

```bash
npm run test:e2e:headed
```

Build aplikacji:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

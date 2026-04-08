# Virtual Wallet

Frontend aplikacji portfela osobistego zbudowany w `React 19` + `TypeScript` + `Vite`, z lekkim backendem `Express` do weryfikacji tokenu Firebase. Dane użytkownika i transakcje są oparte o Firebase Auth oraz Firestore.

## Aktualny stan projektu

- Aktywne ścieżki aplikacji: `/login`, `/register`, `/home/dashboard`, `/home/transactions`.
- Po zalogowaniu aplikacja korzysta ze wspólnego `AppShell`.
- Lewa nawigacja zawiera obecnie: `Pulpit`, `Transakcje`, `Analityka`, `Ustawienia`.
- Pozycja `Karty` została usunięta z lewego sidebara.
- `DashboardPage` pokazuje saldo, formularz dodawania/edycji transakcji i ostatnie operacje.
- `TransactionsPage` pokazuje pełną historię z filtrami oraz doczytywaniem kolejnych rekordów.
- W repo nadal istnieje starszy `HomePage`, ale bieżący routing go nie wykorzystuje.

## Główne moduły

- `src/components/AppShell/AppShell.tsx`: wspólny layout po zalogowaniu, sidebar, topbar i mobilna nawigacja.
- `src/pages/DashboardPage/DashboardPage.tsx`: widok główny z saldem i szybkim zarządzaniem transakcjami.
- `src/pages/TransactionsPage/TransactionsPage.tsx`: lista transakcji z filtrami, paginacją i infinite scroll.
- `src/contexts/AuthContext.tsx`: logowanie email/hasło, Google, reset hasła, utrzymanie sesji.
- `src/services/transactionsService.ts`: odczyt, zapis, aktualizacja, usuwanie i filtrowanie transakcji w Firestore.
- `server/index.js`: endpoint `POST /api/auth/firebase` do weryfikacji tokenu Firebase oraz `GET /api/health`.
- `server/firebase.js`: inicjalizacja Firebase Admin po stronie backendu.

## Stack

- Frontend: `React`, `TypeScript`, `react-router-dom`, `Firebase Web SDK`
- Backend pomocniczy: `Express`, `firebase-admin`
- Narzędzia: `Vite`, `ESLint`, `Prettier`

## Uruchomienie lokalne

1. Zainstaluj zależności:

```bash
npm install
```

2. Uruchom frontend:

```bash
npm run dev
```

3. Uruchom backend:

```bash
npm run dev:server
```

4. Albo oba procesy naraz:

```bash
npm run dev:all
```

Frontend domyślnie działa na `http://localhost:5173`, a backend na `http://localhost:3001`.

## Zmienne środowiskowe

Frontend wymaga konfiguracji Firebase przez:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- opcjonalnie `VITE_FIREBASE_MEASUREMENT_ID`
- opcjonalnie `VITE_API_URL` dla adresu backendu

Backend korzysta z:

- `PORT`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON` lub `FIREBASE_SERVICE_ACCOUNT_PATH`

## Uwagi robocze

- Worktree może zawierać równoległe, niezależne zmiany. Przy commitach warto stage'ować tylko pliki związane z aktualnym zakresem pracy.
- Jeśli pojawi się potrzeba przywrócenia sekcji `Karty`, trzeba dodać zarówno element nawigacji, jak i realną ścieżkę lub widok, bo obecnie taka sekcja nie jest routowana.

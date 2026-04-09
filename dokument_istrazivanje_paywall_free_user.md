# Istraživanje: ograničenja za free korisnike i paywall

Ovaj dokument sumira trenutno stanje aplikacije (math tutor / React Native–Expo), postojeću „analitiku“ u kodu i konkretna mesta gde ima smisla uvesti ograničenja za besplatne korisnike i paywall.

---

## 1. Šta već postoji kao „analitika“

### Centralni modul: `store/analyticsStore.ts`

- Zustand store sa persistencijom (MMKV preko `storage`).
- **Svi događaji prolaze kroz jednu funkciju** `trackEvent` — komentari u kodu eksplicitno predviđaju dodavanje `posthog.capture(event.event, event.properties)` na to mesto (trenutno **nije** uključeno u produkciju).
- Tipizirani događaji:
  - `level_started`, `level_completed`, `level_dropped`
  - `quiz_answer_correct`, `quiz_answer_incorrect`
  - `daily_practice_started`, `daily_practice_completed`, `daily_practice_dropped`
- Store čuva agregate (broj startova po nivou, completion/drop-off stope, dnevna praksa itd.).

**Zaključak za paywall:** Novi događaji tipa `paywall_shown`, `paywall_dismissed`, `upgrade_tapped`, `purchase_completed` najčistije se dodaju u isti `AnalyticsEventName` / `trackEvent` tok, pa i PostHog ostaje na jednom mestu.

### Gde se `trackEvent` poziva (referenca za funnel)

| Lokacija | Šta se meri |
|----------|-------------|
| `app/(tabs)/practice.tsx` | Početak nivoa, završetak / napuštanje sesije |
| `hooks/useQuizEngine.ts` | Tačan / netačan odgovor na kvizu |
| `app/daily-practice.tsx` | Start i završetak dnevne prakse |

Ovo su prirodne tačke za merenje „koliko free korisnika stigne do paywall-a“ i konverzije.

### Brojanje upotrebe (još uvek bez limita): `store/usageStore.ts`

- `tasksCompletedToday` + `incrementTasksCompleted()` (reset po kalendarskom danu).
- Poziva se iz kviz logike (npr. uz tačne odgovore) — **broji, ali ne blokira** ništa.

**Zaključak:** Ovaj store ili proširenje njega može direktno da podrži „X zadataka dnevno za free“ bez novog brojača od nule, uz jasno pravilo u jednom modulu (npr. `AppConfig` ili novi `entitlements`).

---

## 2. Trenutno stanje pretplate / paywall-a

- **Nema** Stripe-a, RevenueCat-a, IAP entitleta ni backend provere pretplate u ovom repou.
- UI: u `app/(tabs)/index.tsx` postoji statičan badge tekst **„Free“** (vizuelni placeholder, bez povezivanja na stanje pretplate).
- Konfiguracija nivoa: u `utils/AppConfig.ts` je `ALL_LEVELS_UNLOCKED: true` — svi nivoi su tretirani kao otključani u logici `LevelManager`-a.
- `utils/LevelManager.ts` — `isLevelUnlocked`: kada je `ALL_LEVELS_UNLOCKED` false, zahteva se završetak prethodnog nivoa (osim `1.1`).
- `components/LevelSelector.tsx` — funkcija `isUnlocked` trenutno **uvek vraća `true`**, pa UI ne prikazuje zaključane kartice čak i kada bi `LevelManager` drugačije odlučio.

**Zaključak:** Pre uvođenja paywall-a treba **uskladiti** izvor istine: ili `LevelManager` + premium pravila, ili novi `subscriptionStore` / `entitlement` sloj koji `LevelSelector` i navigacija koriste istovetno.

---

## 3. Predložena mesta za ograničenja free korisnika

Prioritet je po uticaju na monetizaciju i jednostavnosti implementacije (klijent-only, kao što je app sada).

### A. Nivoi i progresija (visok prioritet)

- **`utils/AppConfig.ts`** — konstante za: koliko prvih nivoa je free, ili da li je `ALL_LEVELS_UNLOCKED` zamenjeno pravilom „free do nivoa Y“.
- **`utils/LevelManager.ts`** — proširiti `isLevelUnlocked` (ili paralelnu funkciju) da uzima u obzir `isPremium` / kupljene nivoe.
- **`components/LevelSelector.tsx`** — zameniti hardkod `return true` stvarnim `isUnlocked`; na zaključanom nivou: CTA ka paywall-u.
- **`app/(tabs)/practice.tsx`** — pre `router` / starta sesije, provera entitleta; alternativno centralizovati u jednom hook-u.

### B. Dnevna praksa i „session“ limiti (visok prioritet)

- **`app/daily-practice.tsx`** — ulaz: ako je free i prekoračen dnevni limit sesija ili zadataka, prikaz paywall-a umesto generatora.
- **`utils/dailyPracticeGenerator.ts`** / **`store/dailyPracticeStore.ts`** — smanjiti broj zadataka ili dostupnih nivoa za free (konfiguracija na jednom mestu).

### C. Slabi delovi (weak practice)

- **`app/weak-practice.tsx`** i **`utils/weakPracticeGenerator.ts`** — često premium feature u edukacionim app-ovima; isti obrazac: guard na početku rute + događaj u analitici.

### D. Assessment test

- **`components/LevelSelector.tsx`** (kartica „Assessment Test“) i tok koji vodi do assessment moda — ograničiti broj pokretanja mesečno za free ili ga staviti iza paywall-a.

### E. Globalni limit zadataka (srednji prioritet)

- **`hooks/useQuizEngine.ts`** — pre obrade sledećeg zadatka ili posle `incrementTasksCompleted`, provera dnevnog/globalnog limita za free.
- Veza sa **`store/usageStore.ts`** — već postoji dnevni brojač; može se dopuniti `FREE_DAILY_TASK_CAP` u konfiguraciji.

### F. Home / Learn tab (UX entry point)

- **`app/(tabs)/index.tsx`** — zameniti statični „Free“ badge dinamičkim stanjem; dugmad „Start“ za dnevnu praksu / linkovi ka teoriji mogu da prikažu paywall kada feature nije u free paketu.

---

## 4. Gde fizički dodati paywall UI

- **Modal / full-screen ekran** kao nova ruta u `app/_layout.tsx` stack-u ili kao komponenta iz `components/` (npr. `PaywallModal.tsx`), pozvana iz tačaka iz sekcije 3.
- **Deep link / ponavljanje:** nakon uspešne kupovine (kada se doda), osvežiti entitlements i ponovo pozvati istu akciju koju je korisnik želeo (npr. `pendingAction` u store-u).

---

## 5. Analitika i A/B test (preporuka)

1. U **`analyticsStore.ts`** proširiti tipove događaja za paywall i pretplatu; u `trackEvent` dodati slanje ka PostHog (ili drugom provideru).
2. Koristiti postojeće događaje (`level_started`, `daily_practice_*`) kao kontekst: npr. koji nivo ili koji ekran je prethodio `paywall_shown`.
3. Eventi koje vredi imati od prvog dana: `paywall_shown` (sa `reason`, `feature`), `paywall_cta_tap`, `purchase_started`, `purchase_success`, `purchase_error`, `restore_purchases_tap`.

---

## 6. Kratak tehnički checklist implementacije

| Korak | Akcija |
|-------|--------|
| 1 | Uvesti `subscriptionStore` (ili `entitlementStore`): `isPremium`, izvor istine (lokalno + kasnije receipt sync). |
| 2 | Centralizovati „da li sme ovaj feature“ u jednom modulu ili hook-u (`useEntitlements`). |
| 3 | Uskladiti `LevelSelector.isUnlocked` sa `LevelManager` + premium pravilima. |
| 4 | Dodati paywall komponentu i navigaciju; guard na ulazima u `daily-practice`, `weak-practice`, assessment, po potrebi u `useQuizEngine`. |
| 5 | Proširiti `trackEvent` i eventualno `usageStore` limitima iz `AppConfig`. |

---

## 7. Napomena o backend-u

Trenutna aplikacija je **klijentski orijentisana**; ograničenja na uređaju mogu se zaobići. Za ozbiljnu monetizaciju dugoročno treba server-side verifikacija kupovine / nalog — to nije u ovom repou, ali ne menja gornju mapu mesta gde UX treba da pokaže paywall i gde se meri funnel.

---

*Dokument generisan na osnovu stanja repozitorijuma; ažurirati po implementaciji novih store-ova i događaja.*

# Specifikacija Matematičke Edukativne Aplikacije

Ovaj dokument opisuje osnovne funkcionalnosti aplikacije, način na koji aplikacija procenjuje matematičke jednačine, kako daje odgovore i kako metodološki uči učenike, na osnovu konceptualnih beleški za "Nivo 1".

## 1. Šta aplikacija mora da radi?

Aplikacija je dizajnirana kao interaktivno okruženje za učenje matematike sa progresivnim nivoima (od osnova sabiranja do složenijih linearnih jednačina prvog stepena). Glavne funkcije su:
*   **Generisanje zadataka i validacija uslova:** Aplikacija dinamički generiše zadatke sa nasumičnim brojevima prema tačnim matematičkim pravilima za svaki pojedinačni nivo (deljivost bez ostatka, pozitivna rešenja, itd).
*   **Praćenje napretka (Niz/Streak):** Prelazak na sledeći nivo zavisi od broja obaveznih *tačnih zadataka u nizu*. Zavisno od nivoa to je 6 ili 10 uzastopnih tačnih rešenja u propisanim kategorijama zadataka.
*   **Evaluacija po koracima (Step-by-step):** Prilikom rešavanja jednačina aplikacija postavlja arhitekturu po nivoima gde učenik mora prvo da ispiše metodološki međukorak (npr. prebacivanje na drugu stranu znaka jednakosti, množenje, deljenje), zatim međurezultat, i tek na kraju konačno rešenje.
*   **Pružanje objašnjenja i uputstava:** Aplikacija prikazuje edukativna tekstualna ili video objašnjenja pre početka novog i naprednijeg nivoa. Pored toga, objašnjenja se trigeruju ponovo onda kada učenik pogreši u primeni pravila.
*   **Sistem detekcije propusta i vraćanja "unazad":** Ukoliko korisnik greši na određenim koracima u rešavanju zadatka, aplikacija jasno prepoznaje na kom matematičkom polju učenik posrće i vraća ga na prethodne, bazičnije nivoe kako bi utvrdio same osnove matematike (npr. greška u pukom deljenju prebacuje učenje unazad na nivo za klasično deljenje brojeva).

## 2. Opšta pravila (Konvencije) za "Nivo 1"

Celokupni početni obim zadataka je kontrolisan strogim matematičkim setinzima generisanja:
*   Svi parametri ($a$, $b$, $c$) su isključivo **celi brojevi**.
*   Rešenja ($x$) moraju uvek biti isključivo **celi pozitivni brojevi**.
*   Izvode se sabiranje i oduzimanje **samo u skupu celih pozitivnih brojeva**.
*   Deljenje **ne sme imati ostatak**, mora biti savršeno i potpuno deljivo.

---

## 3. Metodološki pristup i struktura nivoa

Aplikacija procenjuje razumevanje prepoznavanjem u kom redu i u kom matematičkom postupku je napravljena greška. Sistem nagrađuje niz tačnih odgovora i rigorozno sankcioniše greške po koracima ponavljanje teorije i ponovnim praktikovanjem ranijih lekcija.

### Nivo 1.1: Sabiranje i oduzimanje celih brojeva
*   **Uslov za prelazak:** 10 tačnih u nizu (5 sabiranja + 5 oduzimanja).
*   **Brojevi u zadacima:** $a$ i $b$ su celi brojevi do $100$.
*   **Tipovi zadataka:**
    *   $a + b$
    *   $b - a$ *(uz obavezan uslov da je $b > a$ kako bi rezultat ostao pozitivan)*.

### Nivo 1.2: Množenje i deljenje celih brojeva
*   **Uslov za prelazak:** 10 tačnih u nizu (5 množenja + 5 deljenja).
*   **Brojevi u zadacima:** $a$ i $b$ su brojevi u rasponu do $200$.
*   **Tipovi zadataka:**
    *   $a \cdot b$
    *   $b : a$ ili $\frac{b}{a}$ *(uz obavezan uslov da procenjeni broj $b$ mora biti deljiv brojem $a$)*.

### Nivo 1.3: Jednostavne jednačine (Sabiranje i oduzimanje)
*   **Uvod pre vežbanja:** Obavezno teorijsko objašnjenje putem teksta ili videa.
*   **Uslov za prolaz:** 6 tačnih zadataka u nizu (3 tipa sabiranja i 3 tipa oduzimanja). Parametri do $200$.
*   **Oblici i metodološki koraci (Tumačenje):**
    *   **Jednačina prvog tipa:** $x + a = b$ (gde je generisano $b > a$)
        *   *Korak 1 (Postavka):* $x = b - a$
        *   *Korak 2 (Rešenje):* $x = \text{izračunati rezultat}$
    *   **Jednačina drugog tipa:** $x - a = b$
        *   *Korak 1 (Postavka):* $x = b + a$  (ili $x = a + b$)
        *   *Korak 2 (Rešenje):* $x = \text{izračunati rezultat}$
*   **Detekcija greške (Metodologija vraćanja):**
    *   Ako je netačan **Korak 1** (pogrešan princip prebacivanja preko znaka jednakosti) $\rightarrow$ Aplikacija ponovo otvara i prikazuje **teorijsko uputstvo/objašnjenje**.
    *   Ako je netačan **Korak 2** (učenik je dobro postavio prebacivanje ali je pao na izračunavanju klasične aritmetike) $\rightarrow$ Učenik se vraća nazad na **Nivo 1.1** (Bazično sabiranje i oduzimanje).

### Nivo 1.4: Jednostavne jednačine (Množenje i deljenje)
*   **Uvod pre vežbanja:** Isti uslov kao Nivo 1.3, početno edukativno objašnjenje.
*   **Uslov za prolaz:** 6 tačnih zadataka u nizu (3 množenja i 3 deljenja). Parametri do $200$.
*   **Oblici i metodološki koraci:**
    *   **Jednačina prvog tipa:** $a \cdot x = b$ (uz uslov da je predefinisano generisan broj $b$ srazmerno deljiv sa $a$)
        *   *Korak 1:* $x = b : a$ (ili $\frac{b}{a}$)
        *   *Korak 2:* $x = \text{izračunati rezultat}$
    *   **Jednačina drugog tipa:** $x : a = b$ (ili $\frac{x}{a} = b$)
        *   *Korak 1:* $x = b \cdot a$ (ili $a \cdot b$)
        *   *Korak 2:* $x = \text{izračunati rezultat}$
*   **Detekcija greške (Metodologija vraćanja):**
    *   Pogrešan **Korak 1** (problem algoritamske inverzije jednačine) $\rightarrow$ Prikazivanje početnog tekst/video **objašnjenja**.
    *   Pogrešan **Korak 2** (osnovno matematičko množenje i deljenje muci je nepremostiva) $\rightarrow$ Algoritam ga degradira na nivo osnove i vraća na **Nivo 1.2**.

### Nivo 1.5: Dvokoračne i složene jednačine sa množenjem
*   **Uvod pre vežbanja:** Objašnjenje (tekstu ili video).
*   **Uslov za prolaz:** 6 tačnih nizova, podjednaka raspodela (3+3 u zavisnosti od operatora ispred i iza članova).
*   **Brojevi:** $a, b, c$ do $200$. Uslovi su izuzetno strogi, rezultati izračunavanja $(c-b)$ kao i $(c+b)$ pri generisanju moraju biti tačno **bezuslovno deljivi** sa parametrom $a$.
*   **Oblici i metodološki koraci:**
    *   **Struktura A:** $ax + b = c$
        *   *Korak 1 (Transfer vrednosti):* $ax = c - b$
        *   *Korak 2 (Raslojavanje množenja):* $x = \text{(izračunata gornja razlika)} : a$ (ili podeljeno pod razlomačkom crtom)
        *   *Korak 3 (Konačno deljenje):* $x = \text{finalni rezultat}$
    *   **Struktura B:** $ax - b = c$
        *   *Korak 1:* $ax = c + b$
        *   *Korak 2:* $x = \text{(izračunati gornji zbir)} : a$
        *   *Korak 3:* $x = \text{finalni rezultat}$
*   **Metodologija evaluacije i padanja po koracima:** Ovde učenik može da pogreši na 3 mesta, svaka greška dijagnostikuje drugi problem stoga:
    *   Greška u **Koraku 1** (pogrešan prenos sabiraka) $\rightarrow$ Resetovanje interfejsa obuke i prikaz **teorijskog objašnjenja** sa početka sekcije.
    *   Greška u **Koraku 2** (razumevanje rešavanja operanada bez jednačine, dakle brkanje i dekompozicija same osnove jednačine) $\rightarrow$ Aplikacija ga vraća na **Nivo 1.3**.
    *   Greška u **Koraku 3** (teška borba sa prostim konačnim izvršavanjem i matematičkim množenjem i deljenjem) $\rightarrow$ Evaluacioni povratak u trening i aplikacija degradira obuku na nivo **Nivo 1.4**.

### Nivo 1.6: Dvokoračne i složene jednačine sa deljenjem
*   **Uvod i uslovi pre vežbanja:** Isti raspored i uslovi kao kod prethodnog (6 zadataka). Dodatak novih matematičkih instrukcija.
*   **Oblici i metodološki koraci za rešavanje prve kompozicije:**
    *   **Polazno stanje:** $\frac{x}{a} + b = c$ ili $x:a + b = c$
        *   *Korak 1:* $\frac{x}{a} = c - b$
        *   *Korak 2:* $x = a \cdot \text{izračunati rezultati} (c-b)$  *(ili množenje u obrnuto)*
        *   *Korak 3:* $x = \text{konačno rešenje}$
*   **Oblici i metodološki koraci za rešavanje druge kompozicije:**
    *   **Polazno stanje:** $\frac{x}{a} - b = c$ ili $x:a - b = c$
        *   *Korak 1:* $\frac{x}{a} = c + b$
        *   *Korak 2:* $x = a \cdot \text{izračunati rezultati} (c+b)$
        *   *Korak 3:* $x = \text{konačno rešenje}$
*   **Metodologija evaluacije grešaka:** Ista pravila gradacije kaskadnog vraćanja nazad obeleženo kao i u prethodnom ciklusu. Algoritam za svaki nesavladani korak poziva adekvatan prethodni sub-nivo.
*   **Poseban scenario sa preskakanjem koraka upozorenje napomena:**
    *   Ukoliko učenik u potpunosti preskoči metodologiju koraka (pokuša pisati operacije iz glave usled verovanja da su njegovi lični mentalni algoritmi jači) on može uneti odmah konačno rešenje "sve pod okvirom naprednog razmišljanja polja resenja".
    *   Ukoliko tom prilikom dešifrira samo "X" validacija i izgradi rezultat netačnim rešenjem, sistem ga za tu krupnu grešku oštrije kažnjava šaljući ga u niže nivoe po drastično strožijem principu u poređenju da se držao koraka gde se greške razbijaju segmentisano po sekcijama grešaka.

---

## 5. Zaključak aplikacionog i algoritamskog delovanja

Aplikacija nije prost kviz već pametni tutor. Svaki zadatak i prateći algoritam evaluiraju da li je učenik problem sa samim tipom nove lekcije i shvatanja jednačine usled koje on zaboravlja pravila premeštanja (reakcija na loš prvi korak) ili su mu temelji proste aritmetike slabi gde grešeći u tablici množenja i osnovnog matematičkog algoritma propadaju tačni zadaci iz jednačina. U tom slučaju alat služi svrsi pražnjenja šablona gde detekovanja osnovnog problema degradira obuku da bi se prečistom mehanikom obnovile osnovne radnje računanja na najbazičnijem nivou pred povratak na kompleksnije komade modula jednačina.

sve mora da je na engleskom

na pocetku bira nivo koji zeli da radi i onda mu se prikazuju zadaci iz tog nivoa

moras da vrais u kom je koraku pogreno, i da mu prikazes taj korak ponovo sa objasnjenjem

ako pogresi korak 1, vrati ga na korak 1 i prikazi mu objasnjenje
ako dva puta pogresi vrati na nivo unazad 

na pocektu imamo testiranje za svaki oblast na kraju nam kaze od kog najnizeg nivao krecemo ili da izabre nivo odakle ce da radi, ako ne zeli da radi testiranje onda mu ponudi da izabere nivo odakle ce da radi
na tesiranju samo proveri da li je u stanju da resi zadatke iz tog nivoa, ako ne onda mu ponudi da radi nivo unazad i ne prikazuj gde gresi vec samo na kraju mi prikazi greske i koliko je imao tacnih i netacnih,

ako u linijima pogresi nivo 1.1 1.2 1.3 1.4 onda mu prikazi objasnjenje i vrati ga na nivo 1.1


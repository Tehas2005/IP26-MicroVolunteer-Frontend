Micro-Volunteer Crisis Router

Descrierea Proiectului

Acest proiect reprezintă o platformă care conectează persoanele ce au nevoie de ajutor rapid, la nivel local, cu voluntari din apropiere dispuși să rezolve mici sarcini (micro-task-uri) într-un timp scurt.

Platforma este concepută pentru a facilita ajutorul în situații urgente, necunoscute sau social dificile (cum ar fi nevoia de traducere rapidă, livrări mici, ghidaj local sau verificarea stării unei persoane), bazându-se pe importanța proximității și a cunoștințelor umane locale. O provocare majoră a sistemului este asigurarea unui mediu rapid, dar mai ales sigur și de încredere din punct de vedere social.

Funcționalități Principale (Core Features)

Conform Product Backlog-ului, platforma include următoarele capabilități majore:

•	Cereri de ajutor (Ask for Help): Utilizatorii și vizitatorii (guests - cu funcționalități limitate) pot plasa cereri rapide de ajutor în zona lor.

•	Sistem de Siguranță și Identitate: Identitatea utilizatorilor este verificată, iar în timpul interacțiunilor, identitățile pot fi ascunse pentru a proteja siguranța personală.

•	Profil de Voluntar: Voluntarii își pot adăuga abilitățile specifice pentru a primi recomandări de task-uri la care se pricep cel mai bine.

•	Feed Sortat: Voluntarii au acces la o listă ordonată de cereri de ajutor curente, pentru a putea interveni rapid.

•	Sistem de Rating și Încredere: După fiecare interacțiune, părțile își pot acorda un rating de la 1 la 5 stele. Utilizatorii pot vedea scorul voluntarilor înainte de a le accepta ajutorul, iar sistemul blochează automat utilizatorii cu un scor prea mic.

•	Moderare Automată: Sistemul filtrează automat cererile inadecvate pentru a păstra un standard calitativ al comunității.

•	Comunicare Securizată: Platforma asigură comunicarea directă între voluntar și utilizatorul ajutat pentru buna finalizare a sarcinii.

Metodologie de Lucru (Agile Scrum)

Echipa noastră folosește metodologia Agile Scrum, lucrând în iterații numite Sprint-uri de 2 săptămâni.

•	Scrum Master: Coordonează procesul, menține board-ul de Trello și organizează ședințele (Daily Meetings, Planning, Review/Retrospective). Toată comunicarea trece prin el și nu scrie cod.

•	Developeri: Implementează funcționalitățile și fac revizuirea codului (Code Review) colegilor.

•	Tester: Validează tichetele implementate, creează dovezi (screenshot/video) și se asigură că sunt respectate cerințele.

Fluxul de Lucru Git & Trello (Git Workflow)

Pentru a evita conflictele de cod și a respecta cerințele proiectului, toți programatorii trebuie să urmeze acest flux strict:

1.	Preluarea unui task: Un developer mută un tichet din coloana To Do în In Progress pe Trello.
2.	Crearea Branch-ului: Se creează un branch nou de Git care trebuie să poarte obligatoriu numele/codul tichetului (ex: [FE-001-A] nume-task).
3.	Implementare: Se scrie codul aferent task-ului.
4.	Pull Request (PR): Când munca este gata, se deschide un Pull Request pentru a îmbina branch-ul în main, iar tichetul pe Trello se mută în coloana Code Review.
5.	Code Review: Pull Request-ul trebuie verificat și aprobat de cel puțin un alt membru al echipei înainte de a primi Merge. Apoi, tichetul trece în Dev Done.
6.	Testare: Testerul echipei preia tichetul din Dev Done și îl mută în Testing. Dacă e conform cu Definition of Done, ajunge în Done. Dacă sunt bug-uri, tichetul se întoarce la developeri (In Progress) cu dovezi atașate.


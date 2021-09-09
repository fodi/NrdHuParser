# NrdHuParser
Ez a böngészőben futó script egy viszonylag jól szűrhető, tetszőleges táblázatkezelőbe könnyen átmásolható táblába gyűjti össze az nrd.hu használt laptopjait, mellégyűjtve a processzor és videóvezérlő benchmark pontszámait a PassMark releváns weboldalairól.

Lehetett volna böngészőbővítmény is, de egyelőre csak egy sima weboldal, ahova be kell kopizni három belinkelt weboldal **renderelt** HTML tartalmát (amit pl. a fejlesztői eszközök / vizsgálat alatt lehet felmarkolni), ezeket rágja át.

A CPU és GPU nevek matchelése némi manuális mágia után a Fuse.js nevű bolyhos zsinór gyufázó (fuzzy string matching :) lib segítségével történik.

Ha bármelyik fenti weboldal variál a HTML felépítésén, a script jó eséllyel bedöglik - de ha nyitsz egy issue-t, igyekszem megpatkolni.
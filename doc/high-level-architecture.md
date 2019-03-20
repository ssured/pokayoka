## Geschreven voor Casper op 25 feb 2019

/\*
Pokayoka stack

Wij maken een applicatie die op elk soort apparaat én op elke locatie gebruikt moet kunnen worden. Internet is niet 100% beschikbaar (in een kelder, tunnel, boot etc.), dus werken we met een offline-first architectuur. Alle data staat in de browser en is eigenlijk een eigen server. Zie https://developers.google.com/web/progressive-web-apps/ voor alle nieuwe browser APIs die dit mogelijk maken

De clients synchroniseren met een centraal CouchDB cluster

Het datamodel waar we mee werken is een CRDT (Conflict free replicated datatype), wat master-master replicatie en synchronisatie mogelijk maakt. Het is geinspireerd op https://gun.eco , zie ook vele talks https://www.youtube.com/results?search_query=crdt

Op de server draait CouchDB voor data en authenticatie, met een laagje node-js eroverheen voor wat extra endpoints. Omdat we CRDTs gebruiken is geen REST api nodig. Wel moeten er nog een paar backend services gebouwd worden om snel te kunnen zoeken/indexeren. Eerst iets off-the-shelf als elastic search; later is het heel interessant om wat met AI / beeld interpretatie te doen. Het mooiste voor ons zou zijn als we op basis van de gemaakte foto (bv. van een raam met een barst) kunnen afleiden dat het om een glasreparatie gaat en dat we vanzelf het protocol in beeld zetten en de juiste onderaannemer selecteren. Het zal nog wel een jaartje duren...

Communicatie tussen clients verloopt via websockets, https://github.com/ssbc/muxrpc waarmee we realtime data uitwisselen tussen users. Server en client zijn geschreven in typescript, communicatie is daarmee strong-typed, wat awesome is

Voor de frontend gebruiken we React en Typescript. Data mutaties worden gedaan in https://github.com/mobxjs/mobx-state-tree en synchroniseert live. Components draaien direct op IndexedDB, waardoor een dikke model-laag niet nodig is. Ik ben nog wat aan het spelen met statecharts voor UX, zie bijv. https://www.youtube.com/watch?v=VU1NKX6Qkxc
\*/\*\*

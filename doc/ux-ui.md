Navigatie
Editor voor elementen codering (= MVP = alles is nlsfb)
Editor voor guide (ifixit)
Editor voor checklist / audit (iAuditor)
Editor voor issues (snagtracker)
Editor voor planning projecten (gantt)
Editor voor bestandsbeheer + slugs

https://pokayoka.com/bgdd
https://pokayoka.com/vanwijnen
https://pokayoka.com/spijkerbv

/

- na inloggen
  - mijn projecten (kan meerdere bedrijven omvatten)

Case timmerman Tim (werkt voor SpijkerBV) logt in

Kies werk:

- werk: bgdd/drie-kantoren - 3 taken
- werk: vanwijnen/hoog-gebouw - 5 taken

# bedrijf = bgdd

/bgdd

- Projecten overzicht
  /bgdd/guides
  /bgdd/checklists

Project start = kopie van alle vragenlijsten naar project

# element/nlsfb/ hoogste niveau

[yn]!top = op de hoogte van veiligheidsinstructie BGDD?

## nlsfb/2 ruwbouw

[yn] = is opdracht toegankelijk

### nlsfb/22 binnenwand

#### nlsfb/22.1 dragende binnenwand

[yn] = sparingen gesloten
Toelichting voor het _element_.

##### nlsfb/22.11 spouw

 <Switch value={}>
  ## Afgerond
  <Checkbox default=true na={true} shape={'slider'}/>
  <Photo required=false / >

</Switch>

[photo]bottom = toon afgerond werk
[sign]bottom = paraaf bij afgerond

--> nlsfb heeft een functie nodig die de parent geeft op basis van een code.
nlsfb/ +
nlsfb/2 +
nlsfb/22 +

<!-- nlsfb/22. +  -->

nlsfb/22.1 +
nlsfb/22.11 = spouw
[number]! = gemeten isolatie waarde

Checklist Ruwbouw dragende binnenwand spouw
[yn]!top = op de hoogte van veiligheidsinstructie BGDD?

---

[yn] = is opdracht toegankelijk
[yn] = sparingen gesloten
[number]! = gemeten isolatie waarde

---

[photo]bottom = toon afgerond werk
[sign]bottom = paraaf bij afgerond

/bgdd/nlsfb/22.11 - toont checklists, audits, guide (per rol?)

/bgdd/guide/nlsfb/22.11/${rol?}
/bgdd/checklist/nlsfb/22.11/${rol?} => geen rol impliceert rol = default = onderaannemer / degene die installeert
/bgdd/audit/nlsfb/22.11 => impliceert rol = audit

    MVP = tekst invoer
    [j|n|nvt] is dit gedaan?
    [j|n|nvt+foto!] is dat gedaan?
    Final => GUI

/bgdd/guide/telescooparmen
/bgdd/nlsfb/22.11/checklists

- Verwerkingsinstructies en checklists

/bgdd/audits

- Audits

/bgdd/contact

- Contactpersonen
- Instellingen

# project

/bgdd/drie-kantoren

- Overzicht

/bgdd/drie-kantoren/plan

- Planning

/bgdd/drie-kantoren/tasks

- Opdrachten (bundelt o.a. issues in een opdracht)

/bgdd/drie-kantoren/issues

- Bevindingen (snagtracker)

/bgdd/drie-kantoren/quality

- Audits

/bgdd/drie-kantoren/2d => overzicht van alle (actieve) plattegronden
/bgdd/drie-kantoren/2d/\${slug}

/bgdd/drie-kantoren/2d/1e-verdieping =>
/bgdd/drie-kantoren/pdf/efbcd4/1
/bgdd/drie-kantoren/pdf/562356/1

- MVP schaal is ongewijzigd, dan geen issue
- FUTURE schaal is gewijzigd, dan maak een transform matrix

/bgdd/drie-kantoren/3d => index van alles
/bgdd/drie-kantoren/3d/\${slug} => zelf in te stellen

/bgdd/drie-kantoren/sheet/1e-verdieping
/bgdd/drie-kantoren/sheet/2e-verdieping -> slug naar PDF

/bgdd/drie-kantoren/pdf/${file}/${page?}

- Plattegronden

/bgdd/drie-kantoren/ifc
/bgdd/drie-kantoren/ifc/${file}
/bgdd/drie-kantoren/ifc/${file}/${element = storeys}
/bgdd/drie-kantoren/ifc/${file}/\${guid} uit model

- 3D modellen

- Project instellingen
  /bgdd/drie-kantoren/settings

- Account settings
  /bgdd/settings
  /bgdd/settings/users

/login
Ingelogd als _Tim Jansma_ [uitloggen]
/logout

/user/tim--spijkerbv.nl
/user/tim--gmail.com = zelfde als hierboven
forward naar
/user/tim

- Account

/spijkerbv/license

- Licentie

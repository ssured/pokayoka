import { Storage } from './index';
import { MemoryAdapter } from './adapters/memory';

describe.skip('Storage', () => {
  test('it loads', () => {
    expect(Storage).toBeDefined();
    expect(MemoryAdapter).toBeDefined();
    const storage = new Storage(new MemoryAdapter());
    expect(storage).toBeDefined();
  });
});

/**
 * writeTuple(s, p, o)   => atomair waar gemerged wordt is de o. Hoe kleiner, hoe fijnmaziger de merge, maar hoe meer tombstones zullen ontstaan in de database
 *
 * restricties op o:
 * arrays zijn niet strict in order
 * undefined is toestand nog onbekend (oftewel nog niet uit de database geladen)
 * null is leeg
 * elke aangemaakte s blijft forever ruimte innemen
 * s moet een map object zijn, kan geen set of primitve zijn
 *
 * om HAM uit te kunnen voeren
 * k:['tsp', t, s, p] v:[o] - wat is de historie/toekomst van elk tuple. mag verwijderd worden
 *  = op elk moment in de tijd kan één subject-predicate-object tuple bestaan
 *    in de tijd kan deze wel wijzigen
 *    sort reverse en limit 1 geeft geldende spo tuple
 *
 * opslag formaat:
 *
 * writeTuple("obj", "prop", "value")
 * ["obj"] "prop" "value"
 *
 * writeTuple("obj", "prop", {a: 'A', b: 'B'})
 * ["obj","prop"] "a" "A"
 * ["obj","prop"] "b" "B"
 *
 * writeTuple("obj", "prop", {a: 'A', b: {c: 'C'}})
 * ["obj","prop"] "a" "A"
 * ["obj","prop","b"] "c" "C"
 *
 *
 * Bij schrijf actie kunnen dezelfde tuples die moeten verwijderd worden en die weer
 *
 * writeTuple("obj", "prop", ["A", "B"])
 * + ["obj","prop"] [hash("A")] "A"
 * + ["obj","prop"] [hash("B")] "B"
 *
 * writeTuple("obj", "prop", [{b: 'B'}, "A"]) === writeTuple("obj", "prop", ["A", {b: 'B'}])
 * - valt weg tegen 3 ["obj","prop"] [hash("A")] "A"
 * - ["obj","prop"] [hash("B")] "B"
 * + valt weg tegen 1 ["obj","prop"] [hash("A")] "A"
 * + ["obj","prop"] [hash({b: 'B'})] "B"
 *
 * omdat 1 en 3 gelijk zijn, hoeven deze niet geschreven te worden in de hex database
 *
 *
 * in o kan een link gemaakt worden
 * ["other"] "link" ["obj"] betekent dat other.link === obj
 * ["other","b"] "link" ["obj","c"] betekent dat other.b.link === obj.c
 *
 *
 * elke [S,P,O] combinatie kan __sync__ uitgegeven worden als observable MOBX object of set
 * database gaat lezen en update te properties als deze binnengekomen zijn
 *
 * elk opgevraagd attribuut is initieel undefined, oftewel loading
 * geen waarde (of geen waarde meer) is null
 * anders is er een waarde
 *
 * na iedere mutatie moet het eerste object uit de s array geupdate worden in de database
 */

//  stable stringify
//  stable stringify van een [set], stringify alle elementen in de set, sorteer de set als array en stringify die array

"""Rechnet die mitgelieferten Uebungen mit pooltool nach.

Beantwortet die drei Fragen aus Abschnitt 5.2 des Konzepts:

1. Geht die Uebung mit dem angegebenen Tempo und Effet ueberhaupt auf?
2. Liegt die Zielzone dort, wo der Weisse wirklich hinkommt?
3. Passt die Schwierigkeit 1 bis 10 zur gerechneten Trefferquote?

Jede Uebung wird mehrfach gespielt, jedes Mal mit kleinen Abweichungen in
Richtung, Tempo und Treffpunkt - so, wie ein Mensch nie zweimal gleich
stoesst. Herausgegeben werden Trefferquote, Abzugsquote und die mittlere
Ruhelage des Weissen.

Was dieses Skript NICHT tut: es aendert nichts an der App. Es schreibt
einen Bericht; was daraus folgt, entscheidet ein Mensch.

Aufruf (siehe README.md):
    .venv-pooltool/Scripts/python.exe scripts/pooltool/nachrechnen.py
    .venv-pooltool/Scripts/python.exe scripts/pooltool/nachrechnen.py --laeufe 200
    .venv-pooltool/Scripts/python.exe scripts/pooltool/nachrechnen.py --nur builtin-stop-kurz
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pooltool as pt
from pooltool.ai.aim import at_pos
from pooltool.objects.ball.datatypes import Ball
from pooltool.objects.table.datatypes import Table
from pooltool.objects.table.specs import PocketTableSpecs

HIER = Path(__file__).parent
ZOLL = 0.0254

# ---------------------------------------------------------------- Annahmen --
#
# Diese Zahlen sind gesetzt, nicht gemessen. Sie stehen hier oben, weil jede
# Aussage des Berichts an ihnen haengt.

#: Tempo 1 bis 10 der App in Anfangsgeschwindigkeit des Weissen (m/s).
#:
#: **Diese Umrechnung ist geraten.** Die App sagt zu `speed` nur "1..10"
#: (`src/domain/types.ts:155`), nirgends steht, was eine 6 in Metern je
#: Sekunde bedeutet. Deshalb gibt es den zweiten Betriebsmodus `--modus
#: tempo`: der rechnet rueckwaerts und sagt, welches V0 jede Uebung
#: tatsaechlich verlangt. Erst danach laesst sich diese Zeile belegen.
TEMPO_GRUND = 0.5
TEMPO_SCHRITT = 0.45

#: Welche Anfangsgeschwindigkeiten der Tempo-Modus durchprobiert (m/s).
TEMPO_LEITER = [0.4, 0.55, 0.7, 0.9, 1.1, 1.4, 1.7, 2.1, 2.6, 3.2, 4.0]

#: Streuung eines geuebten Spielers, der dieselbe Uebung mehrfach spielt.
STREUUNG_RICHTUNG = 0.35  # Grad
STREUUNG_TEMPO = 0.04  # Anteil von V0
STREUUNG_TREFFPUNKT = 0.04  # Anteil des Ballradius

#: Wie nah zwei Taschen-Ids einander entsprechen: App -> pooltool.
#: App: x laeuft von 0 bis 100 (Laenge), y von 0 bis 50 (Breite).
#: pooltool: x laeuft ueber die Breite, y ueber die Laenge.
TASCHEN = {
    "bl": "lb",
    "bm": "lc",
    "br": "lt",
    "tl": "rb",
    "tm": "rc",
    "tr": "rt",
}


def tempo_in_v0(tempo: int) -> float:
    """Tempo der App in Anfangsgeschwindigkeit."""
    return TEMPO_GRUND + TEMPO_SCHRITT * tempo


def nach_pt(x: float, y: float) -> tuple[float, float]:
    """App-Koordinaten (Zoll) in pooltool-Koordinaten (Meter)."""
    return (y * ZOLL, x * ZOLL)


def nach_app(pos) -> tuple[float, float]:
    """pooltool-Koordinaten (Meter) zurueck in App-Koordinaten (Zoll)."""
    return (float(pos[1]) / ZOLL, float(pos[0]) / ZOLL)


@dataclass
class Ergebnis:
    """Was bei einer Uebung herauskam."""

    id: str
    name: str
    stufe: str | None
    schwierigkeit: int
    tempo: int
    laeufe: int
    getroffen: int = 0
    falsche_tasche: int = 0
    abzug: int = 0  # Weisser faellt
    in_zone: int = 0
    ruhelagen: list[tuple[float, float]] = field(default_factory=list)
    zone: dict | None = None
    abstuerze: int = 0
    fehler: str | None = None

    @property
    def gueltig(self) -> int:
        """Versuche, die wirklich gerechnet wurden."""
        return self.laeufe - self.abstuerze

    @property
    def trefferquote(self) -> float:
        return self.getroffen / self.gueltig if self.gueltig else 0.0

    @property
    def zonenquote(self) -> float:
        """Anteil der Laeufe in der Zone, gemessen an den Treffern."""
        return self.in_zone / self.getroffen if self.getroffen else 0.0

    @property
    def mitte(self) -> tuple[float, float] | None:
        if not self.ruhelagen:
            return None
        xs = [p[0] for p in self.ruhelagen]
        ys = [p[1] for p in self.ruhelagen]
        return (sum(xs) / len(xs), sum(ys) / len(ys))

    @property
    def streuung(self) -> float:
        """Mittlerer Abstand der Ruhelagen von ihrer Mitte, in Zoll."""
        m = self.mitte
        if m is None:
            return 0.0
        return sum(math.dist(p, m) for p in self.ruhelagen) / len(self.ruhelagen)


def tisch_bauen(tisch: dict) -> Table:
    """Der Tisch der App, nicht der Standardtisch von pooltool.

    pooltool liefert ab Werk einen Tisch mit 78 mal 39 Zoll und etwas
    anderen Taschenmaeulern. Beides wird hier auf die Werte der App
    gesetzt, sonst prueft die Rechnung einen fremden Tisch.
    """
    specs = PocketTableSpecs(
        l=tisch["laenge"] * ZOLL,
        w=tisch["breite"] * ZOLL,
        corner_pocket_width=tisch["eckenmaul"] * ZOLL,
        side_pocket_width=tisch["mittelmaul"] * ZOLL,
    )
    return Table.from_table_specs(specs)


def system_bauen(uebung: dict, tisch: Table) -> pt.System:
    """Alle Baelle der Uebung, mit den Ids der App.

    Auch die Stoerbaelle kommen mit: sie stehen im Weg, und genau das ist
    bei "Durch die Luecke" oder "Cluster oeffnen" die Aufgabe.
    """
    baelle = {"cue": Ball.create("cue", xy=nach_pt(**uebung["weisser"]))}
    for ball in uebung["baelle"]:
        baelle[ball["id"]] = Ball.create(ball["id"], xy=nach_pt(ball["x"], ball["y"]))
    return pt.System(cue=pt.Cue(cue_ball_id="cue"), table=tisch, balls=baelle)


def einmal_spielen(
    uebung: dict,
    tisch: Table,
    wuerfel: np.random.Generator,
    v0_vorgabe: float | None = None,
) -> dict:
    """Ein Versuch, mit Streuung in Richtung, Tempo und Treffpunkt."""
    system = system_bauen(uebung, tisch)
    radius = system.balls["cue"].params.R

    ziel = (*nach_pt(**uebung["anspielpunkt"]), radius)
    phi = at_pos(system, ziel) + wuerfel.normal(0.0, STREUUNG_RICHTUNG)

    v0 = tempo_in_v0(uebung["tempo"]) if v0_vorgabe is None else v0_vorgabe
    v0 = max(0.2, v0 * (1.0 + wuerfel.normal(0.0, STREUUNG_TEMPO)))

    # Das Effet der App: x positiv ist rechts, bei pooltool ist a positiv
    # links. y positiv ist bei beiden Nachlauf.
    a = -uebung["effet"]["x"] + wuerfel.normal(0.0, STREUUNG_TREFFPUNKT)
    b = uebung["effet"]["y"] + wuerfel.normal(0.0, STREUUNG_TREFFPUNKT)

    system.strike(V0=v0, phi=phi, a=a, b=b, theta=uebung["erhoehung"])
    pt.simulate(system, inplace=True)

    getroffen_in = None
    weisser_gefallen = False
    for ereignis in system.events:
        if ereignis.event_type is not pt.EventType.BALL_POCKET:
            continue
        ball, tasche = ereignis.agents[0].id, ereignis.agents[1].id
        if ball == uebung["zielball"]:
            getroffen_in = tasche
        elif ball == "cue":
            weisser_gefallen = True

    return {
        "tasche": getroffen_in,
        "abzug": weisser_gefallen,
        "weisser": None if weisser_gefallen else nach_app(system.balls["cue"].state.rvw[0]),
    }


def uebung_rechnen(
    uebung: dict,
    tisch: Table,
    laeufe: int,
    saat: int,
    v0_vorgabe: float | None = None,
) -> Ergebnis:
    wuerfel = np.random.default_rng(saat)
    erg = Ergebnis(
        id=uebung["id"],
        name=uebung["name"],
        stufe=uebung["stufe"],
        schwierigkeit=uebung["schwierigkeit"],
        tempo=uebung["tempo"],
        laeufe=laeufe,
        zone=uebung["zone"],
    )
    soll = TASCHEN[uebung["tasche"]["id"]]

    for _ in range(laeufe):
        try:
            lauf = einmal_spielen(uebung, tisch, wuerfel, v0_vorgabe)
        except Exception as fehler:  # noqa: BLE001 - der Bericht soll weiterlaufen
            # pooltool 0.3.3 verrechnet sich gelegentlich beim Loesen der
            # Gleichung vierten Grades (Division durch Null in
            # ptmath/roots/core.py). Der Versuch faellt aus, der Rest des
            # Berichts bleibt stehen.
            erg.abstuerze += 1
            erg.fehler = f"{type(fehler).__name__}: {fehler}"
            continue

        if lauf["abzug"]:
            erg.abzug += 1
        if lauf["tasche"] == soll:
            erg.getroffen += 1
            if lauf["weisser"] is not None:
                erg.ruhelagen.append(lauf["weisser"])
                if erg.zone is not None:
                    weg = math.dist(lauf["weisser"], (erg.zone["x"], erg.zone["y"]))
                    if weg <= erg.zone["r"]:
                        erg.in_zone += 1
        elif lauf["tasche"] is not None:
            erg.falsche_tasche += 1

    return erg


def tempo_messen(
    uebung: dict, tisch: Table, laeufe: int, saat: int
) -> tuple[list[tuple[float, Ergebnis]], float | None]:
    """Welches V0 die Uebung verlangt - gemessen statt angenommen.

    Spielt die Uebung die ganze Tempo-Leiter hinauf und sucht die Stufe, bei
    der der Weisse am naechsten an der Zielzone zur Ruhe kommt. Uebungen
    ohne Zone bekommen die Stufe mit der besten Trefferquote.
    """
    stufen: list[tuple[float, Ergebnis]] = []
    for i, v0 in enumerate(TEMPO_LEITER):
        stufen.append((v0, uebung_rechnen(uebung, tisch, laeufe, saat + i * 97, v0)))

    zone = uebung["zone"]
    # Nur Stufen, auf denen die Uebung ueberhaupt aufgeht: eine Ruhelage aus
    # Fehlversuchen sagt nichts ueber die Zielzone.
    brauchbar = [(v0, e) for v0, e in stufen if e.trefferquote >= 0.25 and e.mitte]
    if zone is not None and brauchbar:
        return stufen, min(
            brauchbar, key=lambda p: math.dist(p[1].mitte, (zone["x"], zone["y"]))
        )[0]
    treffer = [(v0, e) for v0, e in stufen if e.trefferquote > 0]
    if treffer:
        return stufen, max(treffer, key=lambda p: p[1].trefferquote)[0]
    return stufen, None


def tempo_bericht(messungen: list[tuple[dict, list[tuple[float, Ergebnis]], float | None]],
                  laeufe: int) -> str:
    zeilen: list[str] = []
    zeilen.append(f"# Welches Tempo die Uebungen verlangen (pooltool {pt.__version__})")
    zeilen.append("")
    zeilen.append(
        "Rueckwaerts gerechnet: jede Uebung wird die Tempo-Leiter "
        f"{TEMPO_LEITER} m/s hinaufgespielt, je {laeufe} Versuche. Gesucht ist die "
        "Stufe, bei der der Weisse am naechsten an seiner Zielzone zur Ruhe kommt "
        "(Uebungen ohne Zone: die Stufe mit der besten Trefferquote)."
    )
    zeilen.append("")
    zeilen.append(
        "| Uebung | Stufe | Tempo laut App | Gemessenes V0 | Treffer dort | "
        "Abstand zur Zone | Bestes erreichbares |"
    )
    zeilen.append("|---|---|---|---|---|---|---|")
    for uebung, stufen, bestes in messungen:
        zone = uebung["zone"]
        if bestes is None:
            zeilen.append(
                f"| {uebung['name']} | {uebung['stufe']} | {uebung['tempo']} | "
                "**kein Treffer auf der ganzen Leiter** | | | |"
            )
            continue
        erg = next(e for v0, e in stufen if v0 == bestes)
        if zone is None:
            abstand, naechstes = "–", "–"
        else:
            abstand = f"{math.dist(erg.mitte, (zone['x'], zone['y'])):.1f}\""
            # Die beste Stufe ueberhaupt, auch wenn dort kaum etwas faellt -
            # sie sagt, ob die Zone wenigstens erreichbar waere.
            alle = [
                (math.dist(e.mitte, (zone["x"], zone["y"])), v0)
                for v0, e in stufen
                if e.mitte and e.trefferquote >= 0.25
            ]
            naechstes = (
                f"{min(alle)[0]:.1f}\" bei {min(alle)[1]} m/s" if alle else "nie getroffen"
            )
        zeilen.append(
            f"| {uebung['name']} | {uebung['stufe']} | {uebung['tempo']} | "
            f"{bestes} m/s | {erg.trefferquote * 100:.0f} % | {abstand} | {naechstes} |"
        )
    return "\n".join(zeilen) + "\n"


def bericht(ergebnisse: list[Ergebnis], laeufe: int) -> str:
    zeilen: list[str] = []
    zeilen.append(f"# Nachrechnung mit pooltool ({pt.__version__})")
    zeilen.append("")
    zeilen.append(
        f"{len(ergebnisse)} Uebungen, je {laeufe} Versuche. "
        f"Streuung: Richtung {STREUUNG_RICHTUNG} Grad, Tempo "
        f"{STREUUNG_TEMPO * 100:.0f} %, Treffpunkt {STREUUNG_TREFFPUNKT:.2f} Ballradien. "
        f"Tempo {{t}} der App = {TEMPO_GRUND} + {TEMPO_SCHRITT} * t m/s."
    )
    zeilen.append("")
    zeilen.append(
        "| Uebung | Stufe | Schwierigkeit | Treffer | Falsche Tasche | Weisser faellt | "
        "In der Zone | Mittlere Ruhelage | Streuung | Zone laut App | Abstand |"
    )
    zeilen.append("|---|---|---|---|---|---|---|---|---|---|---|")

    for e in sorted(ergebnisse, key=lambda x: (x.stufe or "Z", -x.trefferquote)):
        if e.gueltig == 0:
            zeilen.append(
                f"| {e.name} | {e.stufe} | {e.schwierigkeit} | "
                f"**kein Versuch gerechnet: {e.fehler}** | | | | | | | |"
            )
            continue
        mitte = e.mitte
        mitte_text = f"({mitte[0]:.1f} / {mitte[1]:.1f})" if mitte else "–"
        if e.zone is None:
            zone_text, zonenquote, abstand = "–", "–", "–"
        else:
            zone_text = f"({e.zone['x']} / {e.zone['y']}) r{e.zone['r']}"
            zonenquote = f"{e.zonenquote * 100:.0f} %"
            abstand = (
                f"{math.dist(mitte, (e.zone['x'], e.zone['y'])):.1f}\"" if mitte else "–"
            )
        treffer_text = f"{e.trefferquote * 100:.0f} %"
        if e.abstuerze:
            treffer_text += f" ({e.abstuerze} Versuche ausgefallen)"
        zeilen.append(
            f"| {e.name} | {e.stufe} | {e.schwierigkeit}/10 | "
            f"{treffer_text} | {e.falsche_tasche} | {e.abzug} | "
            f"{zonenquote} | {mitte_text} | {e.streuung:.1f}\" | {zone_text} | {abstand} |"
        )

    return "\n".join(zeilen) + "\n"


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--laeufe", type=int, default=100, help="Versuche je Uebung (Vorgabe 100)")
    p.add_argument(
        "--modus",
        choices=("pruefen", "tempo"),
        default="pruefen",
        help="pruefen: mit dem Tempo der App spielen. tempo: das noetige Tempo messen.",
    )
    p.add_argument("--nur", action="append", help="Nur diese Uebungs-Id (mehrfach moeglich)")
    p.add_argument("--saat", type=int, default=20261126, help="Startwert des Zufalls")
    p.add_argument(
        "--eingabe", type=Path, default=HIER / "uebungen.json", help="Woher die Uebungen kommen"
    )
    p.add_argument(
        "--ausgabe", type=Path, default=HIER / "bericht.md", help="Wohin der Bericht geht"
    )
    args = p.parse_args()

    if not args.eingabe.exists():
        print(
            f"{args.eingabe} fehlt. Erst die Uebungen ausgeben:\n"
            "  node --import ./scripts/pooltool/aufloeser.mjs "
            "scripts/pooltool/uebungen-ausgeben.ts",
            file=sys.stderr,
        )
        return 1

    daten = json.loads(args.eingabe.read_text(encoding="utf-8"))
    tisch = tisch_bauen(daten["tisch"])
    uebungen = daten["uebungen"]
    if args.nur:
        uebungen = [u for u in uebungen if u["id"] in set(args.nur)]
        if not uebungen:
            print("Keine Uebung mit dieser Id.", file=sys.stderr)
            return 1

    if args.modus == "tempo":
        messungen = []
        for i, uebung in enumerate(uebungen, start=1):
            print(f"[{i}/{len(uebungen)}] {uebung['name']}", flush=True)
            stufen, bestes = tempo_messen(uebung, tisch, args.laeufe, args.saat + i)
            messungen.append((uebung, stufen, bestes))
        ziel = args.ausgabe if args.ausgabe != HIER / "bericht.md" else HIER / "tempo.md"
        ziel.write_text(tempo_bericht(messungen, args.laeufe), encoding="utf-8")
        ziel.with_suffix(".json").write_text(
            json.dumps(
                [
                    {
                        "id": u["id"],
                        "name": u["name"],
                        "tempo_app": u["tempo"],
                        "v0_gemessen": b,
                        "leiter": [
                            {
                                "v0": v0,
                                "trefferquote": e.trefferquote,
                                "mitte": e.mitte,
                                "abzug": e.abzug,
                            }
                            for v0, e in s
                        ],
                    }
                    for u, s, b in messungen
                ],
                indent=1,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )
        print(f"Bericht: {ziel}")
        return 0

    ergebnisse = []
    for i, uebung in enumerate(uebungen, start=1):
        print(f"[{i}/{len(uebungen)}] {uebung['name']}", flush=True)
        ergebnisse.append(uebung_rechnen(uebung, tisch, args.laeufe, args.saat + i))

    args.ausgabe.write_text(bericht(ergebnisse, args.laeufe), encoding="utf-8")
    (args.ausgabe.with_suffix(".json")).write_text(
        json.dumps(
            [
                {
                    "id": e.id,
                    "name": e.name,
                    "stufe": e.stufe,
                    "schwierigkeit": e.schwierigkeit,
                    "trefferquote": e.trefferquote,
                    "falsche_tasche": e.falsche_tasche,
                    "abzug": e.abzug,
                    "zonenquote": e.zonenquote,
                    "mitte": e.mitte,
                    "streuung": e.streuung,
                    "zone": e.zone,
                    "fehler": e.fehler,
                }
                for e in ergebnisse
            ],
            indent=1,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Bericht: {args.ausgabe}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Wie weit laeuft der Weisse? Tempo in Tischlaengen statt in m/s.

Am Tisch wird das Tempo in Tischlaengen gezaehlt: Tempo 1 ist der Stoss,
bei dem der Weisse von der Kopflinie aus eine Tischlaenge rollt, bis zur
kurzen Bande. Tempo 2 geht hin und zurueck, Tempo 3 drei Laengen, Tempo 4
vier und mehr. Tempo 0,5 ist der Touch-Ball, der in der Tischmitte liegen
bleibt.

Dieses Skript misst die Umrechnung: Fuer jede Geschwindigkeit wird der
Weisse allein auf die Kopflinie gelegt und laengs angestossen, ohne
Ballkontakt. Gemessen wird der zurueckgelegte Weg bis zum Stillstand,
geteilt durch die Tischlaenge.

    ./.venv-pooltool/Scripts/python.exe scripts/pooltool/tischlaengen.py
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np
import pooltool as pt
from pooltool.objects import Ball, Table
from pooltool.objects.table.specs import PocketTableSpecs

HIER = Path(__file__).parent
ZOLL = 0.0254


def tisch_bauen(tisch: dict) -> Table:
    specs = PocketTableSpecs(
        l=tisch["laenge"] * ZOLL,
        w=tisch["breite"] * ZOLL,
        corner_pocket_width=tisch["eckenmaul"] * ZOLL,
        side_pocket_width=tisch["mittelmaul"] * ZOLL,
    )
    return Table.from_table_specs(specs)


def weg_messen(v0: float, tisch: Table, laenge: float, breite: float) -> tuple[float, bool]:
    """Weg des Weissen in Zoll und ob er gefallen ist.

    Der Weisse startet auf der Kopflinie (ein Viertel der Laenge) in der
    Mitte der Breite und laeuft laengs. Auf dieser Linie liegt keine
    Tasche im Weg, die Mitteltaschen sitzen an den Langbanden.
    """
    start = (breite / 2 * ZOLL, laenge / 4 * ZOLL)  # pooltool: (x, y) vertauscht
    system = pt.System(
        cue=pt.Cue(cue_ball_id="cue"),
        table=tisch,
        balls={"cue": Ball.create("cue", xy=start)},
    )
    system.strike(V0=v0, phi=90.0, a=0.0, b=0.0, theta=0.0)
    pt.simulate(system, inplace=True)

    gefallen = any(
        e.event_type is pt.EventType.BALL_POCKET for e in system.events
    )

    # Weg aus den Zustaenden an den Ereignissen aufsummieren. Zwischen zwei
    # Ereignissen laeuft der Ball gerade, also ist die Summe der Abstaende
    # der ganze Weg. history_cts waere erst nach continuize() gefuellt und
    # liefert bis auf 0,04 Prozent dasselbe.
    punkte = [z.rvw[0][:2] for z in system.balls["cue"].history]
    weg = sum(math.dist(a, b) for a, b in zip(punkte, punkte[1:])) / ZOLL
    return weg, gefallen


def main() -> int:
    daten = json.loads((HIER / "uebungen.json").read_text(encoding="utf-8"))
    t = daten["tisch"]
    tisch = tisch_bauen(t)
    laenge = t["laenge"]

    leiter = [0.4, 0.55, 0.7, 0.9, 1.1, 1.4, 1.7, 2.1, 2.6, 3.2, 4.0]
    fein = [round(x, 2) for x in np.arange(0.3, 4.81, 0.1)]

    zeilen = []
    for v0 in sorted(set(leiter + fein)):
        weg, gefallen = weg_messen(v0, tisch, laenge, t["breite"])
        zeilen.append(
            {
                "v0": v0,
                "weg_zoll": weg,
                "tischlaengen": weg / laenge,
                "gefallen": gefallen,
                "auf_der_leiter": v0 in leiter,
            }
        )
        print(
            f"{v0:4.2f} m/s -> {weg:7.1f} Zoll = {weg / laenge:5.2f} Tischlaengen"
            f"{'  (gefallen)' if gefallen else ''}"
            f"{'  *' if v0 in leiter else ''}",
            flush=True,
        )

    (HIER / "tischlaengen.json").write_text(
        json.dumps(zeilen, indent=2), encoding="utf-8"
    )
    print(f"\nGeschrieben: {HIER / 'tischlaengen.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

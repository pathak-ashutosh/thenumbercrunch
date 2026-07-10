#!/usr/bin/env python3
"""Build the compact data snapshot used by the caucus-network blog post."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd


def party(code: int) -> str:
    if code == 100:
        return "D"
    if code == 200:
        return "R"
    return "I"


def rounded(value: object, digits: int) -> float | None:
    if pd.isna(value):
        return None
    return round(float(value), digits)


def build(agora: Path) -> dict[str, object]:
    data = agora / "public" / "data"
    members = pd.read_parquet(data / "members.parquet")
    memberships = pd.read_parquet(data / "memberships.parquet")
    member_stats = pd.read_parquet(data / "member_stats.parquet")
    projection = pd.read_parquet(data / "member_projection.parquet")

    counts = (
        memberships.groupby(["cong", "member_id"])
        .size()
        .rename("caucus_count")
        .reset_index()
    )
    per_member = (
        members.merge(projection, on="member_id", how="inner")
        .merge(counts, on=["cong", "member_id"], how="left")
        .merge(
            member_stats[
                ["cong", "member_id", "betweenness", "cross_party_share"]
            ],
            on=["cong", "member_id"],
            how="left",
        )
        .dropna(subset=["caucus_count"])
        .sort_values(["cong", "member_id"])
    )

    member_counts = memberships.groupby(["cong", "member_id"]).size()
    density = []
    for congress, values in member_counts.groupby(level=0):
        values = values.droplevel(0)
        density.append(
            {
                "g": int(congress),
                "mean": rounded(values.mean(), 2),
                "median": rounded(values.median(), 1),
                "caucuses": int(
                    memberships.loc[memberships["cong"] == congress, "caucus_id"].nunique()
                ),
                "members": int(values.size),
            }
        )

    points = []
    for row in per_member.itertuples(index=False):
        points.append(
            {
                "g": int(row.cong),
                "id": int(row.member_id),
                "n": str(row.mc_name),
                "p": party(int(row.party)),
                "s": str(row.state_abv),
                "x": rounded(row.x, 4),
                "y": rounded(row.y, 4),
                "c": int(row.caucus_count),
                "b": rounded(row.betweenness, 6),
                "q": rounded(row.cross_party_share, 4),
                "i": rounded(row.nominate, 4),
            }
        )

    return {
        "source": "agora/public/data",
        "method": "Pooled 32-dimensional member-caucus SVD, projected to 2D with UMAP.",
        "congresses": [item["g"] for item in density],
        "density": density,
        "points": points,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--agora", type=Path, default=Path("../agora"))
    parser.add_argument(
        "--output", type=Path, default=Path("static/data/caucus-atlas.json")
    )
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(build(args.agora), separators=(",", ":")), encoding="utf-8"
    )


if __name__ == "__main__":
    main()

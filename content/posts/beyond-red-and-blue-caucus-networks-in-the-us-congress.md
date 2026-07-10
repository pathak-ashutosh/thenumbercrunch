---
title: "Beyond Red and Blue: Caucus Networks in the US Congress"
date: 2026-04-15T12:00:00+00:00
lastmod: 2026-07-10T12:00:00+00:00
draft: false
author: "ashutosh"
description: "A hidden map of Congress, a failed prediction, and the clue buried in its past."
categories: ["Data Science", "Network Analysis", "Politics"]
tags: ["congress", "networks", "graph analysis", "machine learning", "political science"]
interactive: true
---

On election night, two colors are enough. By the time Congress starts
governing, they are not.

A member may vote with one party, organize with a regional bloc, work through
an industry caucus, and share a policy coalition with the other side. The
headline still says red versus blue. The working relationships underneath it
are much messier.

I wanted to know whether that hidden layer could be mapped—and whether the map
could tell us anything we did not already know. Congressional caucuses offered
a way in. Some are famous: Progressive, Freedom, Congressional Black Caucus.
Others sound almost invented: Bourbon, Chicken, Baby, Cement.

So I removed the party labels and placed members only by the similarity of
their *full caucus portfolios*. Then I put the colors back. Try the map before
reading on.

{{< caucus-atlas
  title="What red and blue leave out"
  description="Scrub thirteen Congresses. Recolor by affiliation load, network bridge score, or voting ideology. Search or inspect any member."
  caption="Source: Agora's caucus rosters, 103rd–116th Congresses. Position is a pooled 32-dimensional SVD of the member × caucus matrix, projected to 2D with UMAP. Positions are fixed across time so membership changes remain comparable."
>}}

The parties reappear immediately. That is the reassuring part: the map passes
an obvious sanity check without being told what a Democrat or Republican is.

The interesting part is what remains after party. Recolor by **Caucus load**
and the dense joiners appear. Recolor by **Bridge** and a different cast moves
to the foreground. In the 113th or 114th Congress, **Ideology** shows where
voting behavior agrees with the affiliation map—and where it does not.

That mismatch became the thread I followed while building
[Agora](https://github.com/pathak-ashutosh/agora). It led from a simple roster
visualization to a harder question: **can today's affiliation network predict
which caucus a member joins next?**

## 1. The hidden layer

The investigation starts with only three tables:

```text
members(member_id, cong, name, party, state, district, nominate)
caucuses(caucus_id, cong, caucus_name)
memberships(member_id, caucus_id, cong)
```

Together they record 112,122 memberships across thirteen Congresses, from the
103rd through the 116th, with the 104th missing in the source. Each row says
only that a member declared an affiliation with a caucus during one Congress.
It does not say whether they attended, contributed, agreed, or gained
influence. That distinction matters later.

For now, the sparseness of the schema is useful. It gives us one clean object:
a bipartite graph, members on one side and caucuses on the other.

## 2. Turning a roster into a map

The raw graph is faithful but unreadable. Hundreds of caucus nodes produce a
thicket of edges. To see relationships between members, the graph has to be
turned inside out.

{{< stepper
  title="Build the view, one transformation at a time"
  description="Step through the exact path from roster rows to the atlas and prediction task."
  tone="violet"
  caption="Agora precomputes expensive global transforms once, then filters and scores locally in the browser."
>}}
{
  "mode": "code",
  "language": "graph pipeline",
  "code": [
    "member ── membership ── caucus",
    "member ── shared caucuses ── member",
    "member × caucus matrix → SVD₃₂ → UMAP₂",
    "historyₜ₋₂…ₜ + votes + bills → join probabilityₜ₊₁"
  ],
  "steps": [
    {
      "line": 1,
      "title": "Keep the source bipartite",
      "explanation": "A roster row links one member to one caucus in one Congress. This is the lossless representation.",
      "state": {"nodes": "members + caucuses", "edges": "declared memberships"}
    },
    {
      "line": 2,
      "title": "Project for network questions",
      "explanation": "Two members connect when they share caucuses. Edge weight can be a raw count or Jaccard similarity.",
      "state": {"layout": "ForceAtlas2", "communities": "Louvain"}
    },
    {
      "line": 3,
      "title": "Embed the whole portfolio",
      "explanation": "SVD compresses hundreds of binary affiliations into 32 coordinates; UMAP makes the atlas visible in two.",
      "state": {"placement labels": "none", "color labels": "reader choice"}
    },
    {
      "line": 4,
      "title": "Make time the prediction target",
      "explanation": "For every member–caucus pair absent now, rank the chance that it appears in the next Congress.",
      "state": {"train": "older transitions", "test": "112→113 through 115→116"}
    }
  ]
}
{{< /stepper >}}

The classic member projection is one SQL self-join:

```sql
SELECT m1.member_id, m2.member_id, COUNT(*) AS shared
  FROM memberships m1
  JOIN memberships m2 USING (caucus_id, cong)
 WHERE m1.member_id < m2.member_id
   AND m1.cong = ?
 GROUP BY 1, 2;
```

The projection answers “who shares affiliations with whom?” The embedding
asks “whose *whole portfolio* looks like whose?” That produced the atlas at
the top of the post.

The first surprise was not who sat near whom. It was how radically the graph
changed over time.

## 3. The network swelled—and broke the obvious idea

In the 103rd Congress, the median member has four recorded caucuses. By the
115th, the median is 36. Active caucuses rise from 87 to 681 before falling to
617 in the 116th.

{{< chart
  title="Membership load rose almost ninefold"
  description="Toggle mean or median; hover any Congress."
  tone="orange"
  caption="Computed from 112,122 membership rows in Agora. The dip in the 116th may mix real change with roster collection differences."
>}}
{
  "type": "line",
  "labels": ["103", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116"],
  "xLabel": "Congress",
  "yLabel": "Caucuses per member",
  "yDomain": [0, 44],
  "decimals": 1,
  "series": [
    {"name": "Mean", "color": "orange", "values": [4.46, 4.06, 4.65, 7.24, 8.63, 9.41, 19.64, 25.43, 35.49, 36.12, 37.96, 39.60, 32.73]},
    {"name": "Median", "color": "violet", "values": [4, 3, 3, 6, 7, 7, 18, 24, 32, 30, 32, 36, 27.5]}
  ]
}
{{< /chart >}}

My first prediction idea was the standard social-network move:
friend-of-a-friend. If your caucus-mates join another caucus, perhaps you will
too.

It failed. By the later Congresses, almost everyone shares something with
almost everyone else. Common neighbors are no longer a useful clue because the
clue fires nearly everywhere. Its PR-AUC is 0.025—roughly random for this task.
Simply guessing the largest caucuses scores 0.079.

The graph was rich enough to look informative and dense enough to fool the
obvious model. A better snapshot was not the answer. I had to look backward.

## 4. The missing clue was time

For the real test, models learn from older Congresses and are graded on four
newer transitions, 112→113 through 115→116. They rank roughly 646,000 absent
member–caucus pairs. Only 2.66% become memberships, so success means putting a
few real joins near the top—not declaring everything a likely match.

Then the buried pattern appeared: many “new” joins were not new. Across the
held-out transitions, about 24% were members returning to a caucus they had
belonged to in an earlier Congress. A frozen graph cannot see that memory.

{{< model-race
  title="Memory beats a smarter snapshot"
  description="Change the metric, then remove every model allowed to use prior Congresses. The winner changes with the question."
  caption="Held-out results from Agora's reproducible research pipeline. Higher is better. PR-AUC random baseline ≈ 0.027; temporal GNN is the mean of three seeds."
>}}
{
  "models": [
    {"name": "Popularity", "history": false, "auc": 0.678, "ap": 0.079, "mrr": 0.357, "r10": 0.119},
    {"name": "LR · static", "history": false, "auc": 0.693, "ap": 0.069, "mrr": 0.310, "r10": 0.102},
    {"name": "GraphSAGE · static", "history": false, "auc": 0.691, "ap": 0.068, "r10": 0.096},
    {"name": "LR · history only", "history": true, "auc": 0.600, "ap": 0.142, "mrr": 0.332, "r10": 0.145},
    {"name": "LR · static + history", "history": true, "auc": 0.735, "ap": 0.167, "mrr": 0.461, "r10": 0.203},
    {"name": "Temporal GNN", "history": true, "auc": 0.736, "ap": 0.174, "mrr": 0.433, "r10": 0.191}
  ],
  "metrics": {
    "ap": {
      "label": "PR-AUC · precision under imbalance",
      "explanation": "How strongly real joins concentrate near the top across a candidate set where almost every answer is no.",
      "historyVerdict": "The temporal GNN reaches 0.174—2.2× the popularity baseline."
    },
    "auc": {
      "label": "ROC-AUC · pairwise ranking",
      "explanation": "The chance a real join outranks a random non-join. A coin flip scores 0.5.",
      "historyVerdict": "Temporal GNN narrowly leads; static + history is effectively tied."
    },
    "mrr": {
      "label": "MRR · first correct answer",
      "explanation": "How close to rank one the first caucus a member actually joins appears.",
      "historyVerdict": "Simple static + history features beat the temporal GNN on first-hit rank."
    },
    "r10": {
      "label": "Recall@10 · useful shortlist",
      "explanation": "The share of actual joins recovered in each member's ten highest-ranked candidates.",
      "historyVerdict": "Static + history recovers 20.3% of joins; temporal GNN recovers 19.1%."
    }
  }
}
{{< /model-race >}}

The result is not the familiar “deep learning wins” ending. The temporal GNN
has the best aggregate PR-AUC. Plain logistic regression with six history
features is better at putting one correct answer first and recovers more joins
in the top ten.

The model mattered less than the reversal: **how the network changes carried
more signal than a sophisticated reading of one frozen graph**.

## 5. Prediction changed the question

At this point the original map no longer felt sufficient. A caucus roster can
predict affiliation, but affiliation is not action. To ask whether these
groups actually work together, I joined the network to Voteview roll calls and
ProPublica bills and cosponsorships.

Now the interesting cases are not edges. They are disagreements between
layers:

```text
caucus-mates + cosponsors     → affiliation backed by legislative work
caucus-mates − cosponsors     → possibly symbolic affiliation
cosponsors − caucus-mates     → informal working alliance
same votes, different caucuses → same behavior, different coalition path
```

This is where “beyond red and blue” becomes analytically useful. Louvain can
rediscover the two parties; we did not need a graph for that. The stories live
in the residuals: caucus-mates who never cosponsor, legislative partners who
share no caucus, or members who vote alike but travel through different
coalitions.

The prediction model finds where to look. The behavioral layers help decide
whether the pattern means anything.

## 6. Where the story can go wrong

Every step above can support a stronger claim than the data deserves.

**Roster quality.** Offices self-report affiliations on inconsistent schedules.
The 116th-Congress dip above may be politics, collection, or both. Missingness
is not random.

**Affiliation is not participation.** A membership can signal identity,
constituency, fundraising, access, or actual work. Cosponsorship helps test the
last interpretation; it does not settle the others.

**Party dominates.** The caucus network explains residual structure inside
and across parties. It does not make the parties disappear.

**Joining is endogenous.** Members choose caucuses. A graph can describe and
predict that choice; it cannot identify the caucus's causal effect without a
credible design around timing or an external shock.

**Model metrics disagree.** The best global ranker is not the best top-ten
recommender. The intended decision has to come before the metric.

**Public can still become invasive.** Joining enough public person-level data
approaches commercial political profiling. Reasonable boundaries are public
officials only, retrospective analysis, source links, and aggregate reporting
where member-level detail is unnecessary.

## 7. A map for when the news breaks

Congressional networks change more slowly than headlines. That is what makes
them useful. When a bill stalls, the live question is not only which party
opposes it. It is which faction forms the block, who bridges out of it, and
whether the coalition appears in affiliations, votes, legislative work—or
only rhetoric.

Agora keeps the whole investigation in the browser: static Parquet files,
DuckDB-WASM for queries, Sigma for the network, and an ONNX decoder for the
temporal model. The machinery matters mainly because it lets a reader inspect
the same evidence, change the view, and challenge the conclusion.

I started with a red-and-blue map and asked what it hid. The answer was not a
single secret coalition. It was a sequence: affiliations reveal a second
structure; density defeats the obvious predictor; history restores the signal;
behavior determines whether that signal is real.

Red and blue is the opening scene. The story begins when the colors stop being
the explanation.

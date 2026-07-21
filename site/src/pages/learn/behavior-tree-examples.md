---
layout: ../../layouts/ArticleLayout.astro
title: "Behavior Tree Examples: 5 Common Game AI Patterns"
description: "Worked behavior tree examples you can open in a free online editor: patrol/chase/attack enemies, guard posts, fleeing at low health, retry loops, and cooldown-gated special attacks."
pubDate: "2026-07-20"
order: 7
---

# Behavior Tree Examples: Common Game AI Patterns

Most game AI is assembled from a surprisingly small set of recurring tree shapes. This page
catalogs the patterns you'll reuse constantly, as trees you can read here and open in the
[free online editor](/) to modify. If any notation is unfamiliar, see
[the node reference](/learn/behavior-tree-nodes-explained/).

## 1. The priority ladder: patrol / chase / attack

The fundamental enemy shape — a root selector whose children are complete behaviors in
descending priority:

```text
Selector "Enemy brain"
├── Sequence "Attack"   : Is Player In Range? → Attack Player
├── Sequence "Chase"    : Is Player Visible?  → Move To Player
└── Sequence "Patrol"   : Move To Waypoint → Wait → Next Waypoint
```

<a class="try-editor" href="/?example=enemy-patrol">▶ Open this tree in the editor</a>

Each branch is *guarded* by its condition; whichever guard passes first wins the tick.
The bottom branch has no guard — it's the unconditional fallback, so the tree never fails
outright. Nearly every enemy in every genre is this ladder with different rungs.

## 2. Guarded fallback chain: escalating strategies

When one goal has multiple ways to achieve it, order the strategies cheapest-first under a
selector — the classic "open the door" teaching example:

```text
Selector "Enter the room"
├── Sequence: Is Door Open? → Walk Through
├── Sequence: Has Key? → Unlock → Open → Walk Through
└── Sequence: Smash Door → Walk Through
```

<a class="try-editor" href="/?example=open-the-door">▶ Open this tree in the editor</a>

This is the same shape robots use for recovery behaviors — see
[behavior trees in robotics](/learn/behavior-trees-in-robotics/) — replanning, then
clearing sensor maps, then backing up, in escalating order.

## 3. The survival override

Add a top-priority branch that preempts everything when a vital resource runs low:

```text
Selector "Brain"
├── Sequence "Survive"        ← always evaluated first
│   ├── Is Health Low?
│   └── Selector: Flee To Cover | Use Health Item | Fight Cornered
├── ...normal combat ladder...
```

Because selectors re-evaluate every tick, the agent abandons *any* lower branch the moment
health drops — no transitions required. (This exact pattern is why behavior trees beat
state machines for interruptions; see
[the comparison](/learn/behavior-trees-vs-state-machines/).) Add an Inverter over
`Is Health Low?` inside the combat branch if attacking should stop while fleeing.

## 4. Retry with limits

Wrap flaky actions in retry decorators rather than looping in code:

```text
Sequence "Acquire object"
├── Move To Object
└── RepeatUntilSuccess (max 3)
    └── Grasp Object
```

<a class="try-editor" href="/?example=robot-pick-and-place">▶ See it inside the pick-and-place tree</a>

The pattern composes: `RepeatUntilSuccess` around a single grasp, inside a sequence that
repositions first, inside a selector that gives up and asks for help after the retries
exhaust. Each layer of error handling is visible in the structure instead of hidden in code.

## 5. Cooldown-gated specials

Selectors try children in order, so expensive/dramatic attacks go first, gated by cooldown
or resource decorators:

```text
Selector "Choose attack"
├── Limiter/Cooldown (10s) → Sequence: In Range? → Fire Rocket
├── Sequence: Has Ammo? → Shoot
└── Melee Attack
```

The AI automatically "prefers" the special whenever it's legal and degrades gracefully to
basic attacks — designers tune feel by reordering children and adjusting cooldowns, without
touching code. (Attach the cooldown to the *sequence*, not the condition, or you'll start
the cooldown on failed range checks.)

## Composing them

Real agents are these five patterns nested: a survival override on top, a priority ladder
under it, fallback chains inside each rung, retries around unreliable actions, cooldowns on
specials. Because each pattern is a self-contained subtree, you can build and test them
independently, then graft them together.

Build your own in the [behavior tree editor](/) — start from the enemy example, add a
survival branch, and export JSON for [Unity](/learn/behavior-trees-in-unity/),
[Unreal](/learn/behavior-trees-in-unreal-engine/), or your own engine.

<a class="try-editor" href="/?example=enemy-patrol">▶ Start building</a>

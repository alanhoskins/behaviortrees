---
layout: ../../layouts/ArticleLayout.astro
title: "Sequence, Selector, and Decorator Nodes Explained"
description: "A complete reference to behavior tree node types — sequences, selectors, parallels, memory variants, decorators, conditions and actions — with worked examples you can open in a free online editor."
pubDate: "2026-07-20"
order: 2
---

# Sequence, Selector, and Decorator Nodes Explained

Every behavior tree, from a mobile-game chicken to a warehouse robot, is assembled from a
small vocabulary of node types. Master the vocabulary and you can read anyone's tree. This
guide covers each node type, its exact tick semantics, and the situations where you'd reach
for it.

Statuses first, since everything below is defined in terms of them: a ticked node returns
**Success**, **Failure**, or **Running** (needs more ticks to finish).

## Sequence — the AND node

A **Sequence** ticks its children left to right:

- If a child returns **Failure** → the sequence immediately returns **Failure**.
- If a child returns **Running** → the sequence returns **Running**.
- If a child returns **Success** → move on to the next child.
- All children succeeded → **Success**.

Use it for multi-step procedures where every step is required:

```text
Sequence "Use the key"
├── Has Key?          (condition)
├── Unlock Door       (action)
├── Open Door         (action)
└── Walk Through      (action)
```

If `Has Key?` fails, the rest never runs. This is also the standard *guarded action*
pattern: put a condition first and the actions after it only execute when the condition
holds.

## Selector — the OR node (a.k.a. Priority, Fallback)

A **Selector** also ticks children left to right, but with mirrored rules:

- If a child returns **Success** → the selector immediately returns **Success**.
- If a child returns **Running** → the selector returns **Running**.
- If a child returns **Failure** → try the next child.
- All children failed → **Failure**.

Use it to express strategies in priority order — first child is the most preferred:

```text
Selector "Enter the room"
├── Sequence: door already open → walk in
├── Sequence: has key → unlock → open → walk in
└── Sequence: smash the door → walk in
```

<a class="try-editor" href="/?example=open-the-door">▶ Open this tree in the editor</a>

The name varies by ecosystem: Unreal Engine and most game literature say *Selector*,
behavior3-family editors say *Priority*, and the robotics literature (BehaviorTree.CPP)
says *Fallback*. Identical semantics.

## Memory variants — MemSequence and MemSelector

A plain sequence re-ticks from its **first** child every tick. That's what you want for
reactive checks ("is the player still in range?"), but it wastes work — or breaks logic —
for step-by-step procedures that shouldn't restart.

**Memory** composites (`MemSequence`/`MemPriority` in behavior3, "with memory" in other
frameworks) remember which child was Running and resume from it on the next tick, skipping
the earlier children until the whole composite finishes and resets.

Rule of thumb: **reactive guard → plain composite; procedural checklist → memory composite.**

## Parallel — run children together

A **Parallel** ticks *all* children every tick and combines their statuses by policy, e.g.
"succeed when all succeed, fail when one fails." Typical uses: run a movement action while
also playing an animation, or monitor a condition while executing a subtree. Not every
framework ships one (classic behavior3 doesn't); in robotics they're common for
"execute while monitoring" patterns.

## Decorators — one child, modified

A **decorator** wraps a single child and transforms its result or controls its execution:

| Decorator | What it does | Typical use |
|-----------|--------------|-------------|
| Inverter | Success ↔ Failure | "Is enemy **not** visible?" |
| Succeeder / Failer | Always returns Success / Failure | Make an optional step non-blocking |
| Repeater | Repeats child N times (or forever) | Idle loops, animations |
| Repeat Until Success | Loops until the child succeeds | Retry a flaky grasp/grab |
| Repeat Until Failure | Loops until the child fails | "Collect coins while any remain" |
| Limiter | Caps how many times the child can run | One-shot events |
| Max Time | Fails the child if it exceeds a time budget | Path-following timeouts |
| Cooldown | Blocks re-execution for a duration | Special attacks |

Decorator names differ between engines more than any other node type, but almost all of
them are one of these patterns.

## Conditions and Actions — the leaves

**Conditions** read state and answer instantly: Success ("yes") or Failure ("no"). They
should never mutate the world and never return Running — that keeps them safe to re-evaluate
every tick.

**Actions** do the actual work and are where `Running` earns its keep: `MoveTo` returns
Running for the dozens of ticks it takes to walk somewhere, then Success on arrival or
Failure if no path exists.

Design tip: keep leaves *small and parameterized*. A generic `MoveTo(target, speed)` action
reused twelve places beats twelve bespoke movement actions. Your condition/action leaves are
the API between the tree (design) and your engine code (implementation) — the tree stays
readable exactly as long as that API stays clean.

## Putting it together

A realistic enemy AI using nearly every node type above:

```text
Selector "Enemy brain"
├── Sequence "Combat"
│   ├── Is Player In Range?
│   └── Attack Player
├── Sequence "Chase"
│   ├── Is Player Visible?
│   └── Move To Player
└── Sequence "Patrol"          ← lowest priority, always succeeds eventually
    ├── Move To Waypoint
    ├── Wait (2000 ms)
    └── Next Waypoint
```

<a class="try-editor" href="/?example=enemy-patrol">▶ Explore this tree interactively</a>

Every tick, the selector re-evaluates from the top — which is precisely why the enemy
*instantly* switches from patrolling to attacking when you wander into range, with zero
transition logic written anywhere.

## Further reading

- New to the concept? Start with [What Is a Behavior Tree?](/learn/what-is-a-behavior-tree/)
- See these nodes at work in [common game AI patterns](/learn/behavior-tree-examples/)
- Engine-specific guides: [Unity](/learn/behavior-trees-in-unity/) ·
  [Unreal](/learn/behavior-trees-in-unreal-engine/) ·
  [Robotics](/learn/behavior-trees-in-robotics/)

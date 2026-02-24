---
quarter: "Q2 2026"
northStarGoal: "Create a single source of truth for sprint execution and strategic delivery confidence."
strategyNarrative: "This quarter we focus on execution reliability first, decision velocity second, and scale-readiness third. Each lane shows how current delivery converts into next-quarter growth bets."
futureStrategy:
  - "Shift roadmap reporting from manual updates to event-driven auto updates."
  - "Introduce confidence scoring to forecast timeline changes before risk materializes."
  - "Tie delivery milestones directly to revenue and retention impact signals."
priorities:
  must:
    - "Executive roadmap visibility across all squads"
    - "Cross-team dependency ownership and SLAs"
    - "Monthly business impact reviews"
  should:
    - "Automated board pack exports"
    - "Forecast confidence score per initiative"
  niceToHave:
    - "Scenario simulation for strategic alternatives"
lanes:
  - lane: "Current Quarter"
    items:
      - title: "Sprint Health Engine"
        owner: "Product Ops"
        month: "April"
        status: "in_progress"
        completed: 7
        total: 10
        businessValue: "Improves leadership visibility by replacing fragmented status documents."
        dependencies:
          - "Data platform schema freeze"
      - title: "Executive Weekly Digest"
        owner: "Platform"
        month: "May"
        status: "in_progress"
        completed: 5
        total: 8
        businessValue: "Cuts reporting prep time and improves decision cadence in weekly forums."
        dependencies:
          - "Notification service migration"
      - title: "Dependency Risk Signals"
        owner: "Engineering"
        month: "June"
        status: "planned"
        completed: 1
        total: 6
        businessValue: "Flags quarter-impacting blockers earlier for executive intervention."
        dependencies:
          - "Shared taxonomy alignment"
  - lane: "Next Quarter"
    items:
      - title: "Portfolio Confidence Scoring"
        owner: "Data"
        month: "July"
        status: "planned"
        completed: 0
        total: 7
        businessValue: "Provides probability-weighted roadmap commitments for planning cycles."
        dependencies:
          - "Historical sprint benchmark dataset"
      - title: "Regional Rollout View"
        owner: "Business Ops"
        month: "August"
        status: "planned"
        completed: 0
        total: 5
        businessValue: "Allows market-specific sequencing and clearer regional accountability."
        dependencies:
          - "Regional ownership model"
  - lane: "Future Bets"
    items:
      - title: "AI Strategy Co-Pilot"
        owner: "Innovation"
        month: "Q4"
        status: "blocked"
        completed: 1
        total: 9
        businessValue: "Generates strategic what-if plans for leadership scenario workshops."
        dependencies:
          - "Model governance approval"
      - title: "Outcome-Based Planning Layer"
        owner: "Strategy"
        month: "Q4"
        status: "planned"
        completed: 0
        total: 8
        businessValue: "Connects roadmap execution to revenue, margin, and retention outcomes."
        dependencies:
          - "Finance attribution framework"
risksAndDependencies:
  - "Cross-team data quality standards are still inconsistent"
  - "Single bottleneck in analytics event pipeline"
  - "Platform team hiring gap can delay integrations"
expectedBusinessImpact:
  - "Faster decision loops for quarterly trade-offs"
  - "Higher predictability for strategic commitments"
  - "Reduced status-report overhead for delivery teams"
---

Roadmap notes can be added here as markdown body text if needed.
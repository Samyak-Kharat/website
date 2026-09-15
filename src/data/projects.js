// Project content. Media paths are root-relative (no leading slash) so they
// resolve from both the home page and projects/*.html, which prefixes "../".

export const projects = [
  {
    slug: "r2-2024",
    title: "Autonomous ball sorting and storage robot",
    team: "MIT Tech Team — DD Robocon 2024",
    tagline:
      "A fully autonomous robot that found, picked and placed balls into silos with no human input.",
    tech: ["ROS 2", "Nav2", "YOLOv8", "OpenCV", "STM32"],
    role: "Autonomy and navigation",
    period: "Aug 2023 — Jun 2024",
    award: "All India Rank 3",
    hero: "media/r2-2024/hero.webp",
    repo: "",
    demo: "",

    overview: [
      "Robot 2 (R2) was the autonomous system for DD Robocon 2024, built to handle ball detection, selective pick-up and silo placement without human intervention. A three-wheel holonomic omni drive gave it omnidirectional mobility, and closed-loop navigation came from an odometry module, an IMU and distance sensors. Autonomous driving and decision-making ran on ROS 2 using Nav2 and a behaviour tree, while ball acquisition and scoring were handled by a dual-belt mechanism.",
      "A mini PC running ROS served as the main processor, handling path planning, ball detection and decision-making through computer vision, while an STM32 subsystem took care of odometry and low-level control. Splitting the system this way let high-level autonomy and low-level hardware run in parallel, which made the robot more reliable under competition pressure.",
      "During a match it ran the whole pipeline on its own: navigate to the ball zone, use computer vision to pick the correct ball, align with it through sensor feedback, execute the pick-and-place with the belt system, then travel to the silo zone to score. The electronics were built around custom PCBs, closed-loop motor drivers and modular interconnects, so the mini PC, the STM32 subsystem and the actuator boards integrated cleanly. Careful calibration of the odometry, IMU and belt control kept it stable in a fast-changing arena.",
    ],

    gallery: [
      { kind: "video", src: "media/r2-2024/run.mp4", caption: "R2 running a match" },
      { kind: "image", src: "media/r2-2024/team.webp", caption: "MIT Tech Team, 2024" },
      { kind: "youtube", id: "ZlPmcB6rSR4", caption: "The R2 journey" },
    ],

    specs: [
      {
        label: "Drive",
        value: "Three-wheel omni",
        note: "Maxon motors for omnidirectional mobility.",
      },
      {
        label: "Navigation",
        value: "Distance sensors, IMU, odometry",
        note: "Closed-loop position correction and heading stability.",
      },
      {
        label: "Vision",
        value: "OpenCV with YOLOv8",
        note: "Ball detection, tracking and following.",
      },
      {
        label: "Main processor",
        value: "HP mini PC running ROS 2",
        note: "Path planning, Nav2 and the behaviour tree.",
      },
      {
        label: "Subsystem",
        value: "STM32",
        note: "Actuators, sensors and odometry.",
      },
    ],

    results: [
      "All India Rank 3 at DD Robocon 2024.",
      "Completed the full autonomous pipeline in competition — navigation, ball selection, pick-and-place and silo scoring.",
      "The split mini PC and STM32 architecture kept autonomy and low-level control running in parallel without interfering with each other.",
    ],
  },

  {
    slug: "jump-bot",
    title: "Jump Bot",
    team: "MIT Tech Team — DD Robocon 2025",
    tagline:
      "A basketball robot with a LiDAR-based aiming system — the only one at the competition that could dunk.",
    tech: ["ROS 2", "AMCL", "LiDAR", "STM32", "ODrive"],
    role: "Aiming system and controls",
    period: "Aug 2024 — 2025",
    award: "Only team to dunk",
    hero: "media/jump-bot/hero.jpeg",
    repo: "",
    demo: "",

    overview: [
      "Jump Bot was built for DD Robocon 2025, where the theme was basketball. During testing I developed an automatic aiming system using LiDAR and AMCL in ROS 2, which worked out the angle and power needed to put the ball through the hoop from wherever the robot happened to be standing.",
      "In matches it ran as a manual robot, with an STM32 as the brain and an IMU handling angle correction. ODrive drivers and motors drove the shooting mechanism. It was the only robot at DD Robocon capable of performing a dunk.",
    ],

    gallery: [
      { kind: "video", src: "media/jump-bot/dunk.mp4", caption: "The dunk" },
      { kind: "youtube", id: "ubrNTWUxuLw", portrait: true, caption: "Build progress" },
    ],

    specs: [
      {
        label: "Drive",
        value: "Three-wheel omni",
        note: "Maxon motors for omnidirectional mobility.",
      },
      {
        label: "Aiming",
        value: "LiDAR with AMCL on ROS 2",
        note: "Calculated shot angle and power. Developed during the testing phase.",
      },
      {
        label: "Navigation",
        value: "IMU",
        note: "Angle correction while driving.",
      },
      {
        label: "Main brain",
        value: "STM32",
        note: "Low-level control of the mechanism.",
      },
      {
        label: "Actuation",
        value: "ODrive drivers and motors",
        note: "Drove the shooting and dunk mechanism.",
      },
    ],

    results: [
      "The only team at DD Robocon 2025 to complete a dunk.",
      "Automatic aiming using LiDAR and AMCL computed shot angle and power during testing.",
    ],
  },

  {
    slug: "r2-2026",
    title: "Autonomous step-climbing robot",
    team: "MIT Tech Team — DD Robocon 2026",
    tagline:
      "A fully autonomous robot that climbs steps and decides its own route and payload.",
    tech: ["STM32", "Mecanum drive", "Odometry", "ODrive"],
    role: "Autonomy and controls",
    period: "2025 — 2026",
    award: "All India Rank 2",
    hero: "media/r2-2026/hero.jpeg",
    repo: "",
    demo: "",

    overview: [
      "R2 was a fully autonomous robot for DD Robocon 2026, fitted with a step-climbing mechanism. An STM32 acted as the brain, paired with a custom controller for navigation and feedback from distance sensors and odometry.",
      "On top of that sat a decision-making algorithm that chose which path to take through the arena and which box to pick up, so the robot handled route and payload selection on its own rather than following a fixed script.",
    ],

    gallery: [
      { kind: "video", src: "media/r2-2026/step.mp4", caption: "Climbing a step" },
      { kind: "youtube", id: "9kkgwjXrWwE", caption: "The 2026 journey" },
    ],

    specs: [
      {
        label: "Drive",
        value: "Four-wheel mecanum",
        note: "IG42 motors for omnidirectional mobility.",
      },
      {
        label: "Navigation",
        value: "Distance sensors, IMU, odometry",
        note: "Closed-loop feedback with a custom controller.",
      },
      {
        label: "Main brain",
        value: "STM32",
        note: "Actuators, sensors and the decision-making routine.",
      },
      {
        label: "Actuation",
        value: "ODrive drivers and motors",
        note: "Drove the step-climbing mechanism.",
      },
    ],

    results: [
      "All India Rank 2 at DD Robocon 2026.",
      "Autonomous route and payload selection through a decision-making algorithm running on the STM32 controller.",
    ],
  },
];

export const bySlug = (slug) => projects.find((p) => p.slug === slug);

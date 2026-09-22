export const profile = {
  name: "Samyak Kharat",
  mark: "samyak kharat",
  role: "Robotics Control Developer",
  photo: "media/profile/face.webp",

  blurb:
    "I build robotic systems across the stack — from embedded control and real-time systems to perception, planning, and navigation.",

  about: [
    "I'm a robotics engineer working on autonomous systems and embedded control, most recently as a Robotics Control Developer on Tech Team's robots for DD Robocon, where our systems placed AIR 2 in 2023, AIR 3 in 2024, and AIR 2 in 2026.",
    "My interests lie at the intersection of perception and control — building autonomous systems that can navigate and act reliably in real, physical environments. My work focuses on the layer where ROS 2 meets embedded hardware: navigation, sensor fusion, and the low-level control that has to run correctly in real time, not just in simulation.",
  ],

  // `handle` is what's shown; `href` is where it goes. Empty entries are
  // skipped rather than rendered as dead links.
  channels: [
    {
      label: "Email",
      handle: "samyak.kharat@mitwpu.edu.in",
      href: "mailto:samyak.kharat@mitwpu.edu.in",
      note: "Fastest way to reach me",
    },
    {
      label: "GitHub",
      handle: "Samyak-Kharat",
      href: "https://github.com/Samyak-Kharat",
      note: "Code and projects",
    },
    {
      label: "LinkedIn",
      handle: "samyak-kharat",
      href: "https://in.linkedin.com/in/samyak-kharat-06a056250",
      note: "Work history and updates",
    },
    {
      label: "Phone",
      handle: "+91 90229 30903",
      href: "tel:+919022930903",
      note: "Calls and WhatsApp",
    },
  ],

  education: [
    {
      school: "MIT World Peace University",
      detail: "B.Tech in ECE, AI & ML (4th Year)",
      year: "2024 – 2027",
    },
    {
      school: "MIT World Peace University",
      detail: "Diploma in ECE, AI & ML",
      year: "2021 – 2024",
    },
  ],

  experience: [
    {
      role: "Lead — Head of the Bot",
      org: "MIT Tech Team (MTT) — Robocon",
      period: "2026",
      points: [
        "Operated the team's automatic bot at DD Robocon 2026 and helped build its step-climbing mechanism and mecanum-drive autonomous navigation system, a contribution that helped the team finish All India Rank 2.",
      ],
    },
    {
      role: "Mentor — OpenCV Workshop",
      org: "MIT Tech Team (MTT) — Robocon",
      period: "2025 – 2026",
      points: [
        "Taught basic OpenCV concepts and hands-on exercises to 1st- and 2nd-year students as part of the team's internal workshop series.",
      ],
    },
    {
      role: "Senior Engineer",
      org: "MIT Tech Team (MTT) — Robocon",
      period: "2025",
      points: [
        "Developed the core control system for the jump bot in DD Robocon 2025, which the team used to land the season's basketball dunk shot.",
        "Engineered a real-time auto-aim system using LiDAR and odometry during the testing phase, enabling the robot to self-align and dynamically adjust shooting power.",
      ],
    },
    {
      role: "Engineer",
      org: "MIT Tech Team (MTT) — Robocon",
      period: "2024",
      points: [
        "Built an autonomous ROS 2 robot for ball sorting and storage, developing OpenCV-based navigation and object detection that let it locate and store balls without manual input.",
      ],
    },
    {
      role: "Trainee Engineer",
      org: "MIT Tech Team (MTT) — Robocon",
      period: "2023",
      points: [
        "Helped bridge hardware and software by integrating STM32 and ESP32 nodes over CAN and UART for the season's embedded control systems.",
        "Designed and built a manually operated robot with an integrated embedded control system, laying the groundwork for the team's later automation efforts.",
      ],
    },
  ],

  achievements: [
    "AIR 2 — DD Robocon 2026, national level robotics competition.",
    "AIR 3 — DD Robocon 2024, national level robotics competition.",
    "AIR 2 — DD Robocon 2023, national level robotics competition.",
  ],

  stack: [
    { group: "Languages & Tools", items: ["C", "C++", "Python", "Linux", "Git"] },
    {
      group: "Robotics & Simulation",
      items: [
        "ROS 2",
        "Gazebo",
        "RViz 2",
        "ros2_control",
        "Nav2",
        "Docker",
        "Ansible",
        "GitHub Actions",
        "MuJoCo",
      ],
    },
    {
      group: "Perception",
      items: ["OpenCV", "Object Detection", "YOLO", "Sensor Fusion", "Odometry"],
    },
    {
      group: "Embedded",
      items: ["STM32", "TM4C", "CAN", "PWM", "ESP32", "UART"],
    },
  ],
};

/* The only file you need to edit to update the site's content.

   TEAM: add "linkedin" and "github" (full web addresses) for each person.
         Empty ones are hidden automatically. The roles below come from our
         project plan, so each person should check theirs.
   PROJECTS: copy a block to add a new project. It appears on the Projects page.
   RESULTS: these numbers must match the models that are live on the demo. */

window.STOCHOS = {
  demoUrl: "https://transformer.stochos.dev",

  // alphabetical, because nobody is ahead of anybody else
  team: [
    { name: "Ahmed Elsharif",  role: "Data preparation, remaining-life model, interface", linkedin: "", github: "" },
    { name: "Ekhlass Talha",   role: "Fault-diagnosis model, interface",                  linkedin: "", github: "" },
    { name: "Faraj Ali",       role: "Data exploration, remaining-life model",            linkedin: "", github: "" },
    { name: "Mohamed Hwedi",   role: "Data preparation, remaining-life model and testing, interface", linkedin: "", github: "" },
    { name: "Muad Elsalieni",  role: "Data exploration, fault-diagnosis model",           linkedin: "", github: "" },
    { name: "Suliman Hashem",  role: "Data preparation, fault-diagnosis model",           linkedin: "", github: "" }
  ],

  results: {
    caption: "Results on 900 transformers the models had never seen",
    rows: [
      { label: "Fault diagnosed correctly",                    value: "95%" },
      { label: "Diagnoses sent for manual review",             value: "45 of 900" },
      { label: "Remaining life, average error",                value: "40 days" },
      { label: "Remaining life, inside the stated range",      value: "89%" }
    ],
    note: "Each prediction comes with a confidence score or a range. When the model is unsure, it says so."
  },

  projects: [
    {
      title: "Transformer Health Check",
      status: "Live",
      summary: "Reads the gases dissolved in a power transformer's oil, then reports what is wrong with it and how long it has left.",
      tags: ["Time series", "GRU neural networks", "PyTorch", "TensorFlow", "Azure"],
      url: "https://transformer.stochos.dev",
      details: [
        { heading: "The problem",
          text: "Power transformers are expensive, and when one fails without warning the power goes out. As a transformer develops a fault, its oil breaks down and releases gases. Engineers read those gases to spot trouble early, but the readings take expert judgement." },
        { heading: "What we built",
          text: "Two neural networks that read 210 days of gas measurements (four gases, one reading every 12 hours). One names the fault: normal, partial discharge, low-energy discharge or low-temperature overheating. The other estimates remaining life in days, with a range. A web app lets anyone upload a transformer's readings and see both answers, along with how sure the models are." },
        { heading: "What we found",
          text: "On 900 transformers held back until the end, the fault diagnosis was right about 95% of the time, and the life estimate was off by about 40 days on average. About 9 in 10 estimates fell inside the stated range. Predictions the model is unsure about are flagged for a person to review." },
        { heading: "Where it falls short",
          text: "It was trained on one public dataset, so it needs testing on real transformers before anyone relies on it. The life estimate is less precise for transformers with a long time left, and it is a decision aid, not a replacement for an engineer's judgement." }
      ]
    }
  ]
};

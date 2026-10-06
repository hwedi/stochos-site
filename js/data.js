/* Content for the site.

   TEAM: the live site shows each person's profile from the database (name, role, photo,
         introduction, about, skills and links). Each person writes their own on account.html. Team members change their own links on
         account.html, and the maintainer changes roles there. The team list below is the copy
         the site falls back to if the database cannot be reached, and the starting content for
         the database. Keep it in step with the database. "bio" is what a person says about
         themselves. It is written only by that person on account.html. Never write one for them.
   PROJECTS: copy a block to add a new project. It appears on the Projects page.
   RESULTS: these numbers must match the models that are live on the demo. */

window.STOCHOS = {
  demoUrl: "https://transformer.stochos.dev",

  // alphabetical, because nobody is ahead of anybody else
  team: [
    { name: "Ahmed Elsharif",  role: "Data preparation, remaining-life model, interface", bio: "", linkedin: "https://www.linkedin.com/in/ahmed-elsharif-b1ab9127a/", github: "https://github.com/DonMesho" },
    { name: "Ekhlass Talha",   role: "Fault-diagnosis model, interface", bio: "",                  linkedin: "", github: "" },
    { name: "Faraj Ali",       role: "Data exploration, remaining-life model", bio: "",            linkedin: "", github: "" },
    { name: "Mohamed Hwedi",   role: "Data preparation, remaining-life model and testing, interface", bio: "", linkedin: "https://www.linkedin.com/in/hwedi", github: "" },
    { name: "Muad Elsalieni",  role: "Data exploration, fault-diagnosis model", bio: "",           linkedin: "", github: "" },
    { name: "Suliman Hashem",  role: "Data preparation, fault-diagnosis model", bio: "",           linkedin: "https://www.linkedin.com/in/suliman-hashem-421553308", github: "" }
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
        { heading: "The solution",
          text: "Two neural networks that read 210 days of gas measurements (four gases, one reading every 12 hours). One names the fault: normal, partial discharge, low-energy discharge or low-temperature overheating. The other estimates remaining life in days, with a range. A web app lets anyone upload a transformer's readings and see both answers, along with how sure the models are." },
        { heading: "Results",
          text: "On 900 transformers held back until the end, the fault diagnosis was right about 95% of the time, and the life estimate was off by about 40 days on average. About 9 in 10 estimates fell inside the stated range. Predictions the model is unsure about are flagged for a person to review." },
        { heading: "Limitations",
          text: "It was trained on one public dataset, so it needs testing on real transformers before anyone relies on it. The life estimate is less precise for transformers with a long time left, and it is a decision aid, not a replacement for an engineer's judgement." }
      ]
    }
  ]
};

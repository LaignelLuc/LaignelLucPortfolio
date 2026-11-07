/**
 * Compétences — cinq familles, chacune un contact sur le sonar.
 *
 * `angle` est un cap en degrés (0 = nord, sens horaire) : il place le contact
 * sur l'anneau. Aucune notion de niveau : un contact n'est pas plus ou moins
 * loin du centre, la distance ne veut rien dire.
 *
 * `items` mélange des outils (avec `logo`) et des notions qui n'en ont pas :
 * celles-ci s'affichent en texte, jamais en vignette vide.
 */
export const SKILL_FAMILIES = [
  {
    id: "langages",
    label: "Langages",
    summary: "Ce que j'écris, du TP noté au projet livré.",
    angle: 288,
    evidence: "Biosphère7 · Coloration de graphes · Refonte du site",
    items: [
      { name: "Java", logo: "java" },
      { name: "C#", logo: "csharp" },
      { name: "JavaScript", logo: "javascript" },
      { name: "HTML / CSS", logo: "html5" },
      { name: "Python", logo: "python" },
    ],
  },
  {
    id: "systemes",
    label: "Systèmes & réseau",
    summary: "Installer, servir, relier.",
    angle: 72,
    evidence: "Terminal Linux · Nextcloud en réseau virtuel",
    items: [
      { name: "Debian", logo: "debian" },
      { name: "Bash", logo: "bash" },
      { name: "Nextcloud", logo: "nextcloud" },
      { name: "réseau IP" },
      { name: "virtualisation" },
    ],
  },
  {
    id: "conception",
    label: "Conception & données",
    summary: "Penser avant de coder.",
    angle: 144,
    evidence: "Coloration de graphes · Biosphère7",
    items: [
      { name: "UML", logo: "uml" },
      { name: "POO" },
      { name: "algorithmique" },
      { name: "SQL" },
      { name: "modélisation" },
    ],
  },
  {
    id: "outils",
    label: "Outils",
    summary: "La chaîne de travail, du commit au rendu.",
    angle: 0,
    evidence: "Sur les quatre projets",
    items: [
      { name: "GitLab", logo: "gitlab" },
      { name: "NetBeans", logo: "netbeans" },
      { name: "Visual Studio", logo: "visualstudio" },
      { name: "VS Code", logo: "vscode" },
      { name: "Markdown", logo: "markdown" },
    ],
  },
  {
    id: "savoir-faire",
    label: "Savoir-faire",
    summary: "Ce qu'on ne voit pas dans un dépôt.",
    angle: 216,
    evidence: "Coloration de graphes · Gestionnaire JDR",
    items: [
      { name: "tests unitaires" },
      { name: "revue de code" },
      { name: "collaboration" },
      { name: "documentation" },
    ],
  },
];

/** Total des compétences affichées, pour la ligne de synthèse. */
export const SKILL_COUNT = SKILL_FAMILIES.reduce((n, f) => n + f.items.length, 0);

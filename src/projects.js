// One drone per project. Everything the 3D fleet and the project window need
// to display lives here so the copy can be swapped without touching the scene.
export const PROJECTS = [
  {
    id: "retro",
    number: "01",
    title: "Retro-PC dépannage",
    category: "Développement web",
    year: "2025",
    subtitle: "Un site vitrine responsive pour une entreprise de dépannage rétro.",
    description:
      "Site vitrine de trois pages pour Retro-PC dépannage, conçu en mobile first avec des grilles CSS, des composants flexibles et un mode sombre. Le design s'inspire de la maquette cible et l'audit Lighthouse atteint 99 en performance et 100 en bonnes pratiques.",
    stack: ["HTML", "CSS", "Grid", "Lighthouse"],
    accent: "#ffb083",
    screen: "retro",
    drone: { variant: 0 },
  },
  {
    id: "biosphere",
    number: "02",
    title: "Biosphère7",
    category: "Intelligence artificielle",
    year: "2026",
    subtitle: "Deux IA de plateau, une stratégie retenue.",
    description:
      "Développement en binôme de deux intelligences artificielles pour le jeu de plateau Biosphère7 : priorisation des actions, fertilisation et symbiose des plantes, simulation d'un coup à l'avance. La seconde IA, retenue pour sa stratégie, s'est classée dans le top 10 des simulations.",
    stack: ["Java", "IA", "POO", "Algorithmique"],
    accent: "#8ff8ff",
    screen: "biosphere",
    drone: { variant: 1 },
  },
  {
    id: "algo",
    number: "03",
    title: "Exploration algorithmique",
    category: "Algorithmique & graphes",
    year: "2026",
    subtitle: "Colorier un graphe planaire, du modèle objet aux tests.",
    description:
      "Implémentation en binôme d'un graphe orienté en Java, de trois algorithmes de coloration (Welsh-Powell, 6-coloration, 5-coloration) et d'une suite de tests unitaires.",
    stack: ["Java", "JUnit", "Graphes", "UML"],
    accent: "#b9ffd8",
    screen: "algo",
    drone: { variant: 2 },
  },
  {
    id: "nextcloud",
    number: "04",
    title: "Nextcloud en réseau virtuel",
    category: "Réseau & systèmes",
    year: "2026",
    subtitle: "Un serveur auto-hébergé, du réseau virtuel aux postes clients.",
    description:
      "Mise en place d'un réseau virtuel de deux sous-réseaux /24 (routeur, clients, serveur) puis installation et configuration d'un serveur Nextcloud sous Debian : HTTPS, TOTP, groupes et quotas, partages protégés. Intégration d'OnlyOffice, de plugins collaboratifs et de la synchronisation de bureau sur les postes clients.",
    stack: ["Debian", "Nextcloud", "Réseau", "OnlyOffice"],
    accent: "#d9c2ff",
    screen: "nextcloud",
    drone: { variant: 3 },
  },
];

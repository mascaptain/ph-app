<p align="center"><picture><source media="(prefers-color-scheme: dark)" srcset="public/brand/soma-white.svg" /><img src="public/brand/soma.png" alt="SŌMA" width="320" /></picture></p>

# SŌMA

Programme hybride — force et conditionnement.

Application : [SŌMA](https://ph-app-sigma.vercel.app).

## Identité visuelle

Le logo officiel est uniquement typographique : lettres jointives et barre au-dessus du O.
La géométrie vectorielle partagée est dans `src/brand-mark.js` ; `BrandWordmark.jsx`
l'utilise dans tous les écrans. Les exports (favicon, Apple/PWA, partage et emails)
sont dans `public/brand/`, avec une variante blanche pour les fonds sombres.

Régénération : `node scripts/build-brand-assets.mjs /chemin/vers/sharp`.

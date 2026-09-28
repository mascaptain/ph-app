# SOMA 5.8.0

## Ajouts
- Pause vacances / blessure dans Profil > Réglages, dates inclusives et reprise manuelle possible.
- Les périodes de pause préservent la file des séances, l’historique et le compteur ; elles sont exclues des retards et des projections de créneaux.
- La fin du programme est une prévision dépendant des séances restantes et des jours disponibles, pas une échéance fixe.
- Compositeur guidé : classique, AMRAP, EMOM ; nom, durée, exercices ordonnés, unités, charges, séries et repos.
- Bibliothèque personnelle sauvegardée sur le compte. La création ne valide aucune séance.
- Utilisation aujourd’hui avec confirmation explicite du remplacement d’une séance du programme ; snapshot conservé dans le brouillon et l’historique.

## Règles
- EMOM : une station chaque minute, cycles complets ; station en secondes limitée à 50 s.
- AMRAP : tours et mouvements validés manuellement, chrono continu.
- Classique : durée indicative, séries/charges/repos saisis conservés.
- Pas de remplacement d’une séance commencée ou déjà terminée, ni de lancement pendant une pause.
- Un entraînement personnel peut être plus court que les séances générées : sa durée est volontairement saisie par l’utilisateur.

## Correctifs précédemment préparés, inclus
- File de programme indépendante des jours disponibles, variété des blocs et feedback KB.
- Sauvegarde des séances conforme aux colonnes Supabase ; métadonnées des blocs dans feedback.workout.
- Calcul de chrono absolu, sans cadence automatique pour les mouvements AMRAP.

## Validation
- Tests automatisés du programme, horloges, payloads, pauses et compositeur.
- ESLint et compilation Vite.
- Contrôle navigateur connecté laissé à l’utilisateur à sa demande ; aucune validation visuelle revendiquée.
- Migration additive : deux tableaux JSON dans profiles, protections RLS existantes inchangées.

# Joyeux anniversaire — site codé

Un site d'anniversaire animé (HTML / CSS / JavaScript pur, sans dépendance) pensé
**mobile-first**. Écran d'intro façon terminal, feux d'artifice + confettis en canvas,
galerie photos, gâteau dont on souffle les bougies au toucher, et un message de
motivation qui s'écrit tout seul dans un « éditeur de code ».

## Personnaliser (30 secondes)

Ouvre `script.js` et modifie les **3 lignes** tout en haut :

```js
const CONFIG = {
  prenom: "Ghyskaline",                                   // prénom (utilisé dans </prénom>)
  nomComplet: "Jedidia Ghyskaline Louvouezo Nuchaku",  // nom complet sous le titre
  age: null,                                           // ex: 20  (ou null)
  de: "quelqu'un qui croit en toi",                    // signature
};
```

Les photos sont dans `assets/` (`photo1.jpg`, `photo2.jpg`, `photo3.jpg`).
Remplace-les par d'autres en gardant les mêmes noms si tu veux.

## Tester en local

Ouvre simplement `index.html` dans un navigateur, ou lance un petit serveur :

```bash
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

## Mettre en ligne sur GitHub Pages

1. Crée un dépôt GitHub (ex: `anniv`) et pousse ces fichiers :
   ```bash
   git init
   git add .
   git commit -m "Site d'anniversaire"
   git branch -M main
   git remote add origin https://github.com/<ton-user>/anniv.git
   git push -u origin main
   ```
2. Sur GitHub : **Settings → Pages**.
3. **Source** : `Deploy from a branch`, **Branch** : `main` / `/root`, puis **Save**.
4. Au bout d'une minute, le site est en ligne sur :
   `https://<ton-user>.github.io/anniv/`

Partage ce lien : c'est fait pour être vu sur mobile.

## Astuces

- Les photos « se développent » en apparaissant, et s'inclinent en 3D quand on
  bouge le téléphone (gyroscope) ou qu'on glisse le doigt dessus.
- Le bouton en bas à droite coupe / réactive le son.
- Les bougies projettent des étincelles ; taper sur le gâteau les souffle
  (fumée + confettis + feux + fanfare).
- Taper sur le message l'affiche en entier d'un coup.
- Le bouton « Relancer les confettis » en bas relance la fête.

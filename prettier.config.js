/** @type {import("prettier").Config} */
module.exports = {
  semi: false,             // ne pas ajouter de points-virgules
  singleQuote: true,       // utiliser les quotes simples
  trailingComma: "es5",    // virgule finale quand c'est possible (ES5 : objets, tableaux)
  printWidth: 80,          // largeur max de ligne
  tabWidth: 2,             // taille de tabulation
  jsxSingleQuote: true     // quotes simples aussi pour le JSX/TSX
}


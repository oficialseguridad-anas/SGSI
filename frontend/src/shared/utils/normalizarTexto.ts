// Rango Unicode de las marcas diacríticas combinantes (tildes, diéresis, etc.) que deja
// sueltas normalize('NFD'); se filtran por código de punto en vez de un literal de regex
// para no depender de caracteres no-ASCII embebidos en el código fuente.
const INICIO_DIACRITICOS = 0x0300;
const FIN_DIACRITICOS = 0x036f;

// Sin tilde ni mayúsculas, para que "politica" encuentre "Política" y viceversa — usado
// por los buscadores en tiempo real (filtrado en el cliente) de los distintos módulos.
export function normalizarTexto(texto: string) {
  return Array.from(texto.normalize('NFD'))
    .filter((caracter) => {
      const codigo = caracter.codePointAt(0) ?? 0;
      return codigo < INICIO_DIACRITICOS || codigo > FIN_DIACRITICOS;
    })
    .join('')
    .toLowerCase();
}

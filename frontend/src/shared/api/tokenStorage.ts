// El access token vive solo en memoria (variable de módulo), nunca en localStorage:
// un script inyectado por XSS ya no puede robarlo leyendo el almacenamiento del
// navegador. Se pierde al recargar la página a propósito — el arranque de la app pide
// uno nuevo con el refresh token, que viaja en una cookie httpOnly separada que el
// JavaScript del frontend nunca llega a ver (ISO/IEC 27001:2022 A.8.24).
let accessToken: string | null = null;

export const tokenStorage = {
  getAccess: () => accessToken,
  setAccess: (access: string) => {
    accessToken = access;
  },
  clear: () => {
    accessToken = null;
  },
};

import { Route, Routes } from 'react-router-dom';
import { CambiarPasswordPage } from './features/accounts/pages/CambiarPasswordPage';
import { LoginPage } from './features/accounts/pages/LoginPage';
import { DashboardPage } from './features/accounts/pages/DashboardPage';
import { SeguridadPage } from './features/accounts/pages/SeguridadPage';
import { UsuariosPage } from './features/accounts/pages/UsuariosPage';
import { ActivosPage } from './features/activos/pages/ActivosPage';
import { HallazgosPage } from './features/auditorias/pages/HallazgosPage';
import { ControlesPage } from './features/controles/pages/ControlesPage';
import { DocumentosPage } from './features/documentos/pages/DocumentosPage';
import { IncidentesPage } from './features/incidentes/pages/IncidentesPage';
import { IndicadoresPage } from './features/indicadores/pages/IndicadoresPage';
import { ObjetivosPage } from './features/objetivos/pages/ObjetivosPage';
import { RiesgosPage } from './features/riesgos/pages/RiesgosPage';
import { SeguimientoCategoriaPage } from './features/seguimientoAnexoA/pages/SeguimientoCategoriaPage';
import { AdminRoute } from './shared/layout/AdminRoute';
import { PrivateRoute } from './shared/layout/PrivateRoute';
import { Shell } from './shared/layout/Shell';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route path="/cambiar-password" element={<CambiarPasswordPage />} />
        <Route element={<Shell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/activos" element={<ActivosPage />} />
          <Route path="/riesgos" element={<RiesgosPage />} />
          <Route path="/controles" element={<ControlesPage />} />
          <Route
            path="/seguimiento-anexo-a/organizacionales"
            element={<SeguimientoCategoriaPage categoria="ORGANIZACIONAL" titulo="Controles organizacionales" />}
          />
          <Route
            path="/seguimiento-anexo-a/personas"
            element={<SeguimientoCategoriaPage categoria="PERSONAS" titulo="Controles de personas" />}
          />
          <Route
            path="/seguimiento-anexo-a/fisicos"
            element={<SeguimientoCategoriaPage categoria="FISICO" titulo="Controles físicos" />}
          />
          <Route
            path="/seguimiento-anexo-a/tecnologicos"
            element={<SeguimientoCategoriaPage categoria="TECNOLOGICO" titulo="Controles tecnológicos" />}
          />
          <Route path="/hallazgos" element={<HallazgosPage />} />
          <Route path="/incidentes" element={<IncidentesPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/indicadores" element={<IndicadoresPage />} />
          <Route path="/objetivos" element={<ObjetivosPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
          <Route path="/seguridad" element={<SeguridadPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

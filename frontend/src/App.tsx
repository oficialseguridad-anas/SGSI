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
import { SeguimientoPersonasPage } from './features/seguimientoAnexoA/pages/SeguimientoPersonasPage';
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
            element={
              <SeguimientoCategoriaPage
                categoria="ORGANIZACIONAL"
                titulo="Revisión de los Controles Organizacionales de Seguridad de la Información"
                rangoControles="A.5.1 a A.5.37"
              />
            }
          />
          <Route path="/seguimiento-anexo-a/personas" element={<SeguimientoPersonasPage />} />
          <Route
            path="/seguimiento-anexo-a/fisicos"
            element={
              <SeguimientoCategoriaPage
                categoria="FISICO"
                titulo="Revisión de los Controles Físicos de Seguridad de la Información"
                rangoControles="A.7.1 a A.7.14"
              />
            }
          />
          <Route
            path="/seguimiento-anexo-a/tecnologicos"
            element={
              <SeguimientoCategoriaPage
                categoria="TECNOLOGICO"
                titulo="Revisión de los Controles Tecnológicos de Seguridad de la Información"
                rangoControles="A.8.1 a A.8.34"
              />
            }
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

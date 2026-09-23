import { Route, Routes } from 'react-router-dom';
import { CambiarPasswordPage } from './features/accounts/pages/CambiarPasswordPage';
import { LoginPage } from './features/accounts/pages/LoginPage';
import { DashboardPage } from './features/accounts/pages/DashboardPage';
import { SeguridadPage } from './features/accounts/pages/SeguridadPage';
import { EmpleadosPage } from './features/accounts/pages/EmpleadosPage';
import { UsuariosPage } from './features/accounts/pages/UsuariosPage';
import { ActivosPage } from './features/activos/pages/ActivosPage';
import { RevisionesActivosPage } from './features/activos/pages/RevisionesActivosPage';
import { HallazgosPage } from './features/auditorias/pages/HallazgosPage';
import { ControlesPage } from './features/controles/pages/ControlesPage';
import { DocumentosPage } from './features/documentos/pages/DocumentosPage';
import { IncidentesPage } from './features/incidentes/pages/IncidentesPage';
import { IndicadoresPage } from './features/indicadores/pages/IndicadoresPage';
import { ObjetivosPage } from './features/objetivos/pages/ObjetivosPage';
import { RiesgosPage } from './features/riesgos/pages/RiesgosPage';
import { RevisionDireccionPage } from './features/revisionDireccion/pages/RevisionDireccionPage';
import { AuditoriasPage } from './features/auditoriaInterna/pages/AuditoriasPage';
import { MatrizPriorizacionPage } from './features/auditoriaInterna/pages/MatrizPriorizacionPage';
import { ProgramaAuditoriaPage } from './features/auditoriaInterna/pages/ProgramaAuditoriaPage';
import { BackupsPage } from './features/sistema/pages/BackupsPage';
import { CONFIG_FISICOS, CONFIG_ORGANIZACIONALES, CONFIG_TECNOLOGICOS } from './features/seguimientoAnexoA/configCategorias';
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
          <Route path="/activos/revisiones" element={<RevisionesActivosPage />} />
          <Route path="/riesgos" element={<RiesgosPage />} />
          <Route path="/controles" element={<ControlesPage />} />
          <Route
            path="/seguimiento-anexo-a/organizacionales"
            element={<SeguimientoCategoriaPage config={CONFIG_ORGANIZACIONALES} />}
          />
          <Route path="/seguimiento-anexo-a/personas" element={<SeguimientoPersonasPage />} />
          <Route
            path="/seguimiento-anexo-a/fisicos"
            element={<SeguimientoCategoriaPage config={CONFIG_FISICOS} />}
          />
          <Route
            path="/seguimiento-anexo-a/tecnologicos"
            element={<SeguimientoCategoriaPage config={CONFIG_TECNOLOGICOS} />}
          />
          <Route path="/hallazgos" element={<HallazgosPage />} />
          <Route path="/incidentes" element={<IncidentesPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/indicadores" element={<IndicadoresPage />} />
          <Route path="/objetivos" element={<ObjetivosPage />} />
          <Route path="/revision-direccion" element={<RevisionDireccionPage />} />
          <Route path="/matriz-priorizacion-auditoria" element={<MatrizPriorizacionPage />} />
          <Route path="/programa-auditoria" element={<ProgramaAuditoriaPage />} />
          <Route path="/auditorias" element={<AuditoriasPage />} />
          <Route path="/empleados" element={<EmpleadosPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/backups" element={<BackupsPage />} />
          </Route>
          <Route path="/seguridad" element={<SeguridadPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

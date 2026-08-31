import { AimOutlined, AuditOutlined, DatabaseOutlined, LineChartOutlined, WarningOutlined } from '@ant-design/icons';
import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { GraficaActivosPorClase } from '../../dashboard/components/GraficaActivosPorClase';
import { GraficaActivosPorCriticidad } from '../../dashboard/components/GraficaActivosPorCriticidad';
import { GraficaAvanceActividadesPorObjetivo } from '../../dashboard/components/GraficaAvanceActividadesPorObjetivo';
import { GraficaCumplimientoIndicadores } from '../../dashboard/components/GraficaCumplimientoIndicadores';
import { GraficaEstadoActividadesObjetivos } from '../../dashboard/components/GraficaEstadoActividadesObjetivos';
import { GraficaEstadoSeguimientoIndicadores } from '../../dashboard/components/GraficaEstadoSeguimientoIndicadores';
import { GraficaHallazgosEstado } from '../../dashboard/components/GraficaHallazgosEstado';
import { GraficaHallazgosPorProceso } from '../../dashboard/components/GraficaHallazgosPorProceso';
import { GraficaHallazgosTipo } from '../../dashboard/components/GraficaHallazgosTipo';
import { GraficaObjetivosPorProceso } from '../../dashboard/components/GraficaObjetivosPorProceso';
import { GraficaRiesgosEstado } from '../../dashboard/components/GraficaRiesgosEstado';
import { GraficaRiesgosPorNivel } from '../../dashboard/components/GraficaRiesgosPorNivel';
import { GraficaRiesgosTratamiento } from '../../dashboard/components/GraficaRiesgosTratamiento';

const { Title, Paragraph } = Typography;

interface SeccionModuloProps {
  icono: ReactNode;
  titulo: string;
  children: ReactNode;
}

function SeccionModulo({ icono, titulo, children }: SeccionModuloProps) {
  return (
    <Card
      style={{ marginBottom: 16 }}
      title={
        <Space size={8}>
          <span style={{ color: '#0f5c4f', fontSize: 16 }}>{icono}</span>
          <span>{titulo}</span>
        </Space>
      }
    >
      <Row gutter={16}>{children}</Row>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Title level={3}>Bienvenido, {user?.nombre_completo}</Title>
        <Paragraph>
          Este es el panel del SGSI. Ya puedes consultar Activos, Riesgos, Controles (SoA), Documentos e
          Indicadores desde el menú lateral. Los módulos de auditorías e incidentes se irán habilitando
          en las próximas fases.
        </Paragraph>
        <Paragraph>
          Roles asignados: {user?.roles.length ? user.roles.map((r) => <Tag key={r}>{r}</Tag>) : 'Ninguno'}
        </Paragraph>
      </Card>

      <SeccionModulo icono={<DatabaseOutlined />} titulo="Activos">
        <Col xs={24} lg={12}>
          <Card title="Activos por criticidad" size="small" variant="borderless">
            <GraficaActivosPorCriticidad />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Activos por clase" size="small" variant="borderless">
            <GraficaActivosPorClase />
          </Card>
        </Col>
      </SeccionModulo>

      <SeccionModulo icono={<WarningOutlined />} titulo="Riesgos">
        <Col xs={24} lg={8}>
          <Card title="Riesgos por nivel" size="small" variant="borderless">
            <GraficaRiesgosPorNivel />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Riesgos por estado" size="small" variant="borderless">
            <GraficaRiesgosEstado />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Estado del tratamiento" size="small" variant="borderless">
            <GraficaRiesgosTratamiento />
          </Card>
        </Col>
      </SeccionModulo>

      <SeccionModulo icono={<AuditOutlined />} titulo="Hallazgos de auditoría">
        <Col xs={24} lg={8}>
          <Card title="Hallazgos por estado" size="small" variant="borderless">
            <GraficaHallazgosEstado />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Hallazgos por tipo" size="small" variant="borderless">
            <GraficaHallazgosTipo />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Hallazgos por proceso" size="small" variant="borderless">
            <GraficaHallazgosPorProceso />
          </Card>
        </Col>
      </SeccionModulo>

      <SeccionModulo icono={<LineChartOutlined />} titulo="Indicadores">
        <Col xs={24} lg={12}>
          <Card title="Estado de seguimiento" size="small" variant="borderless">
            <GraficaEstadoSeguimientoIndicadores />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Cumplimiento" size="small" variant="borderless">
            <GraficaCumplimientoIndicadores />
          </Card>
        </Col>
      </SeccionModulo>

      <SeccionModulo icono={<AimOutlined />} titulo="Objetivos">
        <Col xs={24} lg={8}>
          <Card title="Estado de las actividades" size="small" variant="borderless">
            <GraficaEstadoActividadesObjetivos />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Avance de actividades por objetivo" size="small" variant="borderless">
            <GraficaAvanceActividadesPorObjetivo />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Objetivos por proceso asociado" size="small" variant="borderless">
            <GraficaObjetivosPorProceso />
          </Card>
        </Col>
      </SeccionModulo>
    </>
  );
}

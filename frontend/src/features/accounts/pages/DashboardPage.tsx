import { Card, Col, Row, Tag, Typography } from 'antd';
import { useAuth } from '../../../app/AuthContext';
import { GraficaActivosPorCriticidad } from '../../dashboard/components/GraficaActivosPorCriticidad';

const { Title, Paragraph } = Typography;

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Title level={3}>Bienvenido, {user?.nombre_completo}</Title>
        <Paragraph>
          Este es el panel del SGSI. Ya puedes consultar Activos, Riesgos, Controles (SoA) y Documentos
          desde el menú lateral. Los módulos de objetivos, indicadores, auditorías e incidentes se irán
          habilitando en las próximas fases.
        </Paragraph>
        <Paragraph>
          Roles asignados: {user?.roles.length ? user.roles.map((r) => <Tag key={r}>{r}</Tag>) : 'Ninguno'}
        </Paragraph>
      </Card>

      <Row gutter={16}>
        <Col xs={24} sm={12} lg={8}>
          <Card title="Activos por criticidad" size="small">
            <GraficaActivosPorCriticidad />
          </Card>
        </Col>
      </Row>
    </>
  );
}

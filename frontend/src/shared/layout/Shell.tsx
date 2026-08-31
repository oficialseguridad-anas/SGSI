import {
  AimOutlined,
  AuditOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  KeyOutlined,
  LineChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Menu } from 'antd';
import { useMemo, useState, type SyntheticEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { LOGO_SRC } from '../theme/brand';

function ocultarSiFallaLogo(evento: SyntheticEvent<HTMLImageElement>) {
  evento.currentTarget.style.display = 'none';
}

const { Header, Sider, Content } = Layout;

interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  perm?: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: 'activos', path: '/activos', label: 'Activos', icon: <DatabaseOutlined />, perm: 'activos.view_activo' },
  { key: 'riesgos', path: '/riesgos', label: 'Riesgos', icon: <WarningOutlined />, perm: 'riesgos.view_riesgo' },
  {
    key: 'controles',
    path: '/controles',
    label: 'Controles (SoA)',
    icon: <SafetyCertificateOutlined />,
    perm: 'controles.view_aplicabilidadcontrol',
  },
  {
    key: 'hallazgos',
    path: '/hallazgos',
    label: 'Hallazgos de auditoría',
    icon: <AuditOutlined />,
    perm: 'auditorias.view_hallazgo',
  },
  {
    key: 'documentos',
    path: '/documentos',
    label: 'Documentos',
    icon: <FileTextOutlined />,
    perm: 'documentos.view_documento',
  },
  {
    key: 'indicadores',
    path: '/indicadores',
    label: 'Indicadores',
    icon: <LineChartOutlined />,
    perm: 'indicadores.view_indicador',
  },
  {
    key: 'objetivos',
    path: '/objetivos',
    label: 'Objetivos',
    icon: <AimOutlined />,
    perm: 'objetivos.view_objetivo',
  },
  { key: 'usuarios', path: '/usuarios', label: 'Usuarios', icon: <TeamOutlined />, adminOnly: true },
  { key: 'seguridad', path: '/seguridad', label: 'Seguridad', icon: <SafetyOutlined /> },
];

export function Shell() {
  const { user, logout, hasPerm } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const items = useMemo(
    () =>
      NAV_ITEMS.filter((item) => (!item.perm || hasPerm(item.perm)) && (!item.adminOnly || user?.is_superuser)).map(
        (item) => ({
          key: item.key,
          icon: item.icon,
          label: <Link to={item.path}>{item.label}</Link>,
        }),
      ),
    [user],
  );

  const selectedKey = NAV_ITEMS.find((item) => item.path === location.pathname)?.key ?? 'dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        breakpoint="lg"
        collapsedWidth={0}
        style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '16px 8px' : '16px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <img
            src={LOGO_SRC}
            alt="ANAS WAYUU E.P.S.I."
            style={{ height: 28, width: 28, objectFit: 'contain', flexShrink: 0 }}
            onError={ocultarSiFallaLogo}
          />
          {!collapsed && (
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>
              ANAS WAYUU EPSI
              <br />
              <span style={{ fontWeight: 400, fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>SGSI ISO 27001</span>
            </span>
          )}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={items} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((prev) => !prev)}
          />
          <Dropdown
            menu={{
              items: [
                { key: 'cambiar-password', icon: <KeyOutlined />, label: 'Cambiar contraseña' },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar sesión' },
              ],
              onClick: ({ key }) => {
                if (key === 'cambiar-password') {
                  navigate('/cambiar-password');
                  return;
                }
                logout();
                navigate('/login');
              },
            }}
          >
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small">{user?.nombre_completo?.charAt(0).toUpperCase() ?? '?'}</Avatar>
              <span>{user?.nombre_completo ?? user?.email}</span>
            </div>
          </Dropdown>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

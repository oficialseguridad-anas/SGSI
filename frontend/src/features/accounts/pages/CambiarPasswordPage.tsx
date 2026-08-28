import { LockOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Typography, message } from 'antd';
import { useState, type SyntheticEvent } from 'react';
import { useAuth } from '../../../app/AuthContext';
import { BRAND, LOGO_SRC } from '../../../shared/theme/brand';
import { cambiarPassword } from '../api';

function ocultarSiFallaLogo(evento: SyntheticEvent<HTMLImageElement>) {
  evento.currentTarget.style.display = 'none';
}

interface FormValues {
  password_actual: string;
  password_nueva: string;
  password_confirmacion: string;
}

export function CambiarPasswordPage() {
  const { refreshUser, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFinish(values: FormValues) {
    setError(null);
    setLoading(true);
    try {
      await cambiarPassword(values.password_actual, values.password_nueva);
      message.success('Contraseña actualizada correctamente.');
      await refreshUser();
    } catch (err) {
      const detalle =
        (err as { response?: { data?: { password_actual?: string[]; password_nueva?: string[] } } }).response?.data;
      setError(
        detalle?.password_actual?.[0] ?? detalle?.password_nueva?.[0] ?? 'No se pudo cambiar la contraseña.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div
        className="login-brand-panel"
        style={{
          flex: 1,
          background: `linear-gradient(160deg, ${BRAND.teal} 0%, ${BRAND.tealDark} 100%)`,
          color: '#fff',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 48,
          textAlign: 'center',
        }}
      >
        <img
          src={LOGO_SRC}
          alt="ANAS WAYUU E.P.S.I."
          style={{ width: 140, marginBottom: 24, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
          onError={ocultarSiFallaLogo}
        />
        <Typography.Title level={2} style={{ color: '#fff', marginBottom: 4 }}>
          ANAS WAYUU E.P.S.I.
        </Typography.Title>
        <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 320 }}>
          Sistema de Gestión de Seguridad de la Información — ISO/IEC 27001:2022
        </Typography.Text>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: BRAND.bg,
          padding: 24,
        }}
      >
        <Card style={{ width: 380, borderTop: `3px solid ${BRAND.orange}` }} styles={{ body: { paddingTop: 20 } }}>
          <Typography.Title level={4} style={{ marginTop: 0 }}>
            Debes cambiar tu contraseña
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Por seguridad, tu cuenta requiere una nueva contraseña antes de continuar.
          </Typography.Paragraph>
          {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
          <Form layout="vertical" onFinish={onFinish} disabled={loading}>
            <Form.Item
              name="password_actual"
              label="Contraseña actual"
              rules={[{ required: true, message: 'Ingresa tu contraseña actual' }]}
            >
              <Input.Password prefix={<LockOutlined />} autoComplete="current-password" autoFocus />
            </Form.Item>
            <Form.Item
              name="password_nueva"
              label="Contraseña nueva"
              rules={[
                { required: true, message: 'Ingresa la contraseña nueva' },
                { min: 8, message: 'Debe tener al menos 8 caracteres' },
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="password_confirmacion"
              label="Confirmar contraseña nueva"
              dependencies={['password_nueva']}
              hasFeedback
              rules={[
                { required: true, message: 'Confirma la contraseña nueva' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password_nueva') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Las contraseñas no coinciden'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Cambiar contraseña
              </Button>
            </Form.Item>
            <Button type="link" block onClick={() => logout()}>
              Cerrar sesión
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}

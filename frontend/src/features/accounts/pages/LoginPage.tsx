import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Form, Input, Typography, message } from 'antd';
import { useState, type SyntheticEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../app/AuthContext';
import { BRAND, LOGO_SRC } from '../../../shared/theme/brand';
import { reenviarOtp } from '../api';
import type { MetodoOtp } from '../types';

function ocultarSiFallaLogo(evento: SyntheticEvent<HTMLImageElement>) {
  evento.currentTarget.style.display = 'none';
}

interface LoginFormValues {
  email: string;
  password: string;
}

interface OtpFormValues {
  codigo: string;
}

export function LoginPage() {
  const { login, completarLoginOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cerradaPorInactividad = searchParams.get('motivo') === 'inactividad';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<MetodoOtp | null>(null);
  const [reenviando, setReenviando] = useState(false);

  async function onFinishCredenciales(values: LoginFormValues) {
    setError(null);
    setLoading(true);
    try {
      const resultado = await login(values.email, values.password);
      if ('requiere_otp' in resultado) {
        setOtpToken(resultado.otp_token);
        setMetodo(resultado.metodo);
        return;
      }
      navigate('/', { replace: true });
    } catch {
      setError('Credenciales inválidas. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  }

  async function onFinishOtp(values: OtpFormValues) {
    if (!otpToken) return;
    setError(null);
    setLoading(true);
    try {
      await completarLoginOtp(otpToken, values.codigo);
      navigate('/', { replace: true });
    } catch {
      setError('Código de verificación inválido.');
    } finally {
      setLoading(false);
    }
  }

  async function onReenviar() {
    if (!otpToken) return;
    setReenviando(true);
    try {
      await reenviarOtp(otpToken);
      message.success('Te enviamos un nuevo código a tu correo.');
    } catch {
      message.error('No se pudo reenviar el código. Espera unos segundos e intenta de nuevo.');
    } finally {
      setReenviando(false);
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
        <Typography.Text style={{ color: BRAND.gold, fontSize: 16, fontStyle: 'italic' }}>
          Juntos Gestionamos Salud
        </Typography.Text>
        <Divider style={{ borderColor: 'rgba(255,255,255,0.25)', margin: '32px 0' }} />
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
        <Card
          style={{ width: 380, borderTop: `3px solid ${BRAND.orange}` }}
          styles={{ body: { paddingTop: 20 } }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <img src={LOGO_SRC} alt="" style={{ height: 32 }} onError={ocultarSiFallaLogo} />
            <div>
              <Typography.Text strong style={{ display: 'block', fontSize: 15, color: BRAND.teal }}>
                ANAS WAYUU EPSI
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Iniciar sesión — SGSI ISO/IEC 27001:2022
              </Typography.Text>
            </div>
          </div>
        {!otpToken && cerradaPorInactividad && !error && (
          <Alert
            type="info"
            showIcon
            message="Tu sesión se cerró por inactividad."
            style={{ marginBottom: 16 }}
          />
        )}
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

        {!otpToken ? (
          <Form layout="vertical" onFinish={onFinishCredenciales} disabled={loading}>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Ingresa tu email' }]}>
              <Input prefix={<UserOutlined />} autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label="Contraseña" rules={[{ required: true, message: 'Ingresa tu contraseña' }]}>
              <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Iniciar sesión
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={onFinishOtp} disabled={loading}>
            <Typography.Paragraph type="secondary">
              {metodo === 'EMAIL'
                ? 'Te enviamos un código a tu correo. Ingrésalo a continuación (o usa uno de tus códigos de recuperación).'
                : 'Ingresa el código de tu aplicación de autenticación o uno de tus códigos de recuperación.'}
            </Typography.Paragraph>
            <Form.Item
              name="codigo"
              label="Código de verificación"
              rules={[{ required: true, message: 'Ingresa el código' }]}
            >
              <Input prefix={<SafetyOutlined />} autoComplete="one-time-code" autoFocus />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Verificar
              </Button>
            </Form.Item>
            {metodo === 'EMAIL' && (
              <Button type="link" block onClick={onReenviar} loading={reenviando}>
                Reenviar código
              </Button>
            )}
            <Button type="link" block onClick={() => { setOtpToken(null); setMetodo(null); setError(null); }}>
              Volver
            </Button>
          </Form>
        )}
        </Card>
      </div>
    </div>
  );
}

import { MailOutlined, MobileOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Space, Steps, Tag, Typography, message } from 'antd';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useAuth } from '../../../app/AuthContext';
import {
  activar2fa,
  activarEmail2fa,
  desactivar2fa,
  enviarCodigoEmailActivacion,
  setup2fa,
} from '../api';
import type { Setup2FA } from '../types';

const { Paragraph, Text } = Typography;

type Metodo = 'APP' | 'EMAIL';

const NOMBRE_METODO: Record<Metodo, string> = {
  APP: 'Aplicación de autenticación',
  EMAIL: 'Correo electrónico',
};

export function SeguridadPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metodoElegido, setMetodoElegido] = useState<Metodo | null>(null);
  const [setupData, setSetupData] = useState<Setup2FA | null>(null);
  const [emailListoParaConfirmar, setEmailListoParaConfirmar] = useState(false);
  const [codigosRecuperacion, setCodigosRecuperacion] = useState<string[] | null>(null);

  function reiniciar() {
    setMetodoElegido(null);
    setSetupData(null);
    setEmailListoParaConfirmar(false);
    setError(null);
  }

  async function elegirApp() {
    setError(null);
    setLoading(true);
    try {
      const data = await setup2fa();
      setMetodoElegido('APP');
      setSetupData(data);
    } catch {
      setError('No se pudo iniciar la configuración del doble factor.');
    } finally {
      setLoading(false);
    }
  }

  async function elegirEmail() {
    setError(null);
    setLoading(true);
    try {
      await enviarCodigoEmailActivacion();
      setMetodoElegido('EMAIL');
      setEmailListoParaConfirmar(true);
      message.success(`Te enviamos un código a ${user?.email}.`);
    } catch {
      setError('No se pudo enviar el código por correo.');
    } finally {
      setLoading(false);
    }
  }

  async function reenviarCodigoEmail() {
    setError(null);
    setLoading(true);
    try {
      await enviarCodigoEmailActivacion();
      message.success('Te enviamos un nuevo código.');
    } catch {
      setError('Espera unos segundos antes de solicitar otro código.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmarActivacionApp(values: { codigo: string }) {
    setError(null);
    setLoading(true);
    try {
      const { codigos_recuperacion } = await activar2fa(values.codigo);
      setCodigosRecuperacion(codigos_recuperacion);
      reiniciar();
      await refreshUser();
    } catch {
      setError('Código de verificación inválido.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmarActivacionEmail(values: { codigo: string }) {
    setError(null);
    setLoading(true);
    try {
      const { codigos_recuperacion } = await activarEmail2fa(values.codigo);
      setCodigosRecuperacion(codigos_recuperacion);
      reiniciar();
      await refreshUser();
    } catch {
      setError('Código de verificación inválido.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmarDesactivacion(values: { password: string; codigo: string }) {
    setError(null);
    setLoading(true);
    try {
      await desactivar2fa(values.password, values.codigo);
      message.success('Doble factor de autenticación desactivado.');
      await refreshUser();
    } catch {
      setError('Contraseña o código incorrectos.');
    } finally {
      setLoading(false);
    }
  }

  if (codigosRecuperacion) {
    return (
      <Card title="Doble factor activado">
        <Alert
          type="warning"
          showIcon
          message="Guarda estos códigos de recuperación"
          description="Cada uno se puede usar una sola vez para iniciar sesión si pierdes acceso a tu método habitual. No se volverán a mostrar."
          style={{ marginBottom: 16 }}
        />
        <Space orientation="vertical" style={{ fontFamily: 'monospace', fontSize: 16 }}>
          {codigosRecuperacion.map((codigo) => (
            <Text key={codigo} code>{codigo}</Text>
          ))}
        </Space>
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={() => setCodigosRecuperacion(null)}>
            Ya los guardé
          </Button>
        </div>
      </Card>
    );
  }

  if (user?.otp_habilitado) {
    return (
      <Card title="Seguridad de la cuenta">
        <Paragraph>
          Doble factor de autenticación: <Tag color="green">Activado</Tag>{' '}
          <Tag>{NOMBRE_METODO[user.otp_metodo]}</Tag>
        </Paragraph>
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <Paragraph type="secondary">
          Para desactivarlo, confirma tu contraseña y un código vigente
          {user.otp_metodo === 'EMAIL' ? ' (puedes pedir uno nuevo iniciando sesión) ' : ' de tu aplicación de autenticación '}
          o uno de tus códigos de recuperación.
        </Paragraph>
        <Form layout="vertical" onFinish={confirmarDesactivacion} disabled={loading} style={{ maxWidth: 360 }}>
          <Form.Item name="password" label="Contraseña" rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item name="codigo" label="Código de verificación" rules={[{ required: true }]}>
            <Input autoComplete="one-time-code" />
          </Form.Item>
          <Button danger htmlType="submit" loading={loading}>
            Desactivar doble factor
          </Button>
        </Form>
      </Card>
    );
  }

  if (metodoElegido === 'APP' && setupData) {
    return (
      <Card title="Activar doble factor por aplicación">
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <Steps
          orientation="vertical"
          size="small"
          items={[
            {
              title: 'Escanea el código QR',
              content: (
                <Space orientation="vertical">
                  <QRCodeSVG value={setupData.otpauth_url} size={180} />
                  <Text type="secondary">
                    Usa Google Authenticator, Microsoft Authenticator o similar. Si no puedes escanear,
                    ingresa manualmente esta clave:
                  </Text>
                  <Text code>{setupData.secreto}</Text>
                </Space>
              ),
            },
            {
              title: 'Confirma con un código',
              content: (
                <Form layout="vertical" onFinish={confirmarActivacionApp} disabled={loading} style={{ maxWidth: 280 }}>
                  <Form.Item name="codigo" label="Código de 6 dígitos" rules={[{ required: true }]}>
                    <Input autoComplete="one-time-code" autoFocus />
                  </Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Activar
                    </Button>
                    <Button onClick={reiniciar}>Cancelar</Button>
                  </Space>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    );
  }

  if (metodoElegido === 'EMAIL' && emailListoParaConfirmar) {
    return (
      <Card title="Activar doble factor por correo">
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <Paragraph>
          Te enviamos un código de 6 dígitos a <Text strong>{user?.email}</Text>. Puede tardar unos minutos.
        </Paragraph>
        <Form layout="vertical" onFinish={confirmarActivacionEmail} disabled={loading} style={{ maxWidth: 280 }}>
          <Form.Item name="codigo" label="Código de 6 dígitos" rules={[{ required: true }]}>
            <Input autoComplete="one-time-code" autoFocus />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Activar
            </Button>
            <Button onClick={reenviarCodigoEmail} loading={loading}>
              Reenviar código
            </Button>
            <Button onClick={reiniciar}>Cancelar</Button>
          </Space>
        </Form>
      </Card>
    );
  }

  return (
    <Card title="Seguridad de la cuenta">
      <Paragraph>
        Doble factor de autenticación: <Tag color="red">Desactivado</Tag>
      </Paragraph>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      <Paragraph type="secondary">
        Agrega una capa adicional de seguridad a tu inicio de sesión. Elige cómo quieres recibir el código:
      </Paragraph>
      <Space>
        <Button type="primary" icon={<MobileOutlined />} onClick={elegirApp} loading={loading}>
          Usar app de autenticación
        </Button>
        <Button icon={<MailOutlined />} onClick={elegirEmail} loading={loading}>
          Usar correo electrónico
        </Button>
      </Space>
    </Card>
  );
}

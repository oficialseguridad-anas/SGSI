import { CheckCircleOutlined, CloudUploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Alert, Button, Card, Col, Row, Space, Statistic, Typography, message } from 'antd';
import { useState } from 'react';
import { ejecutarBackup, fetchEstadoBackups } from '../api';
import type { InfoBackup, ResultadoBackup } from '../types';

const ETIQUETAS: Record<string, string> = {
  base_datos: 'Base de datos',
  media: 'Archivos (Documentos, Activos, etc.)',
  aplicacion: 'Código de la aplicación',
};

function formatearFecha(epochSegundos: number) {
  return new Date(epochSegundos * 1000).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

function TarjetaCategoria({ clave, info, cargando }: { clave: string; info: InfoBackup | null; cargando: boolean }) {
  return (
    <Card size="small" title={ETIQUETAS[clave]} loading={cargando}>
      {info ? (
        <>
          <Statistic value={info.tamano_mb} suffix="MB" precision={1} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {info.nombre}
            <br />
            {formatearFecha(info.fecha)} · {info.total_backups} guardado{info.total_backups === 1 ? '' : 's'}
          </Typography.Text>
        </>
      ) : (
        <Typography.Text type="secondary">Sin backups todavía.</Typography.Text>
      )}
    </Card>
  );
}

export function BackupsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['sistema-backups'], queryFn: fetchEstadoBackups });
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoBackup | null>(null);

  const mutation = useMutation({
    mutationFn: ejecutarBackup,
    onSuccess: (resultado) => {
      setUltimoResultado(resultado);
      message.success('Backup completado.');
      queryClient.invalidateQueries({ queryKey: ['sistema-backups'] });
    },
    onError: (error: AxiosError<ResultadoBackup>) => {
      const resultado = error.response?.data;
      setUltimoResultado(resultado ?? null);
      message.error(resultado?.error ?? 'No se pudo ejecutar el backup.');
    },
  });

  const backups = data?.backups;

  return (
    <Card title="Backups del SGSI">
      <Typography.Paragraph type="secondary">
        Copia de seguridad de la base de datos, los archivos subidos (Documentos, Activos,
        etc.) y el código fuente de la aplicación. Se ejecuta automáticamente todos los días
        a las 2:00 a.m. (Tarea Programada de Windows) y se puede disparar manualmente aquí
        cuando se necesite antes de esa hora — por ejemplo, antes de un cambio importante.
        Cada archivo queda guardado dos veces en el servidor: en backend/backups/ y en
        la carpeta "Documentos" de Windows (Documentos\SGSI_Backups\). Al terminar, se
        envía un correo de aviso al administrador con el resumen (los archivos en sí no
        viajan por correo, solo el aviso).
      </Typography.Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          {(backups
            ? Object.entries(backups)
            : Object.keys(ETIQUETAS).map((clave) => [clave, null] as const)
          ).map(([clave, info]) => (
            <Col xs={24} sm={8} key={clave}>
              <TarjetaCategoria clave={clave} info={info} cargando={isLoading} />
            </Col>
          ))}
        </Row>

        <Button
          type="primary"
          size="large"
          icon={<CloudUploadOutlined />}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Ejecutando backup... (puede tardar cerca de un minuto)' : 'Ejecutar backup ahora'}
        </Button>

        {ultimoResultado && (
          <Alert
            type={ultimoResultado.exito ? 'success' : 'error'}
            icon={ultimoResultado.exito ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            showIcon
            message={ultimoResultado.exito ? 'Último backup: completado' : 'Último backup: falló'}
            description={
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 12 }}>
                {ultimoResultado.error ?? ultimoResultado.salida}
                {ultimoResultado.correo ? `\n\nCorreo: ${ultimoResultado.correo}` : ''}
              </pre>
            }
          />
        )}
      </Space>
    </Card>
  );
}

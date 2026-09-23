import { UploadOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Modal, Typography, Upload, message } from 'antd';
import { useState } from 'react';
import { importarEmpleados } from '../api';
import type { ResumenImportacionEmpleados } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportarEmpleadosModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ResumenImportacionEmpleados | null>(null);

  const mutation = useMutation({
    mutationFn: importarEmpleados,
    onSuccess: (resumen) => {
      setResultado(resumen);
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      if (resumen.creados || resumen.actualizados) {
        message.success(`Importación lista: ${resumen.creados} creados, ${resumen.actualizados} actualizados.`);
      }
    },
    onError: () => message.error('No se pudo importar el archivo — verifica que sea el .xlsx de la plantilla.'),
  });

  function cerrar() {
    setArchivo(null);
    setResultado(null);
    onClose();
  }

  return (
    <Modal
      title="Importar empleados por lote"
      open={open}
      onCancel={cerrar}
      onOk={() => archivo && mutation.mutate(archivo)}
      okText="Importar"
      okButtonProps={{ disabled: !archivo, loading: mutation.isPending }}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">
        Descarga la plantilla, diligénciala (una fila por empleado) y súbela aquí. Si
        un correo o nombre ya existe en el directorio, se actualiza en vez de
        duplicarse — puedes volver a subir el mismo archivo corregido sin problema.
      </Typography.Paragraph>
      <Upload
        beforeUpload={(file) => {
          setArchivo(file);
          setResultado(null);
          return false;
        }}
        onRemove={() => setArchivo(null)}
        maxCount={1}
        accept=".xlsx"
        fileList={archivo ? [{ uid: '1', name: archivo.name, status: 'done' }] : []}
      >
        <Button icon={<UploadOutlined />}>Seleccionar archivo .xlsx</Button>
      </Upload>
      {resultado && (
        <Alert
          style={{ marginTop: 16 }}
          type={resultado.omitidos.length ? 'warning' : 'success'}
          showIcon
          message={`${resultado.creados} creados, ${resultado.actualizados} actualizados${resultado.omitidos.length ? `, ${resultado.omitidos.length} omitidos` : ''}.`}
          description={
            resultado.omitidos.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {resultado.omitidos.map((linea) => (
                  <li key={linea}>{linea}</li>
                ))}
              </ul>
            ) : undefined
          }
        />
      )}
    </Modal>
  );
}

from django.db import migrations

CONTROLES = [
    ('5.1', 'Políticas de seguridad de la información', 'ORGANIZACIONAL'),
    ('5.2', 'Roles y responsabilidades de seguridad de la información', 'ORGANIZACIONAL'),
    ('5.3', 'Segregación de funciones', 'ORGANIZACIONAL'),
    ('5.4', 'Responsabilidades de la dirección', 'ORGANIZACIONAL'),
    ('5.5', 'Contacto con autoridades', 'ORGANIZACIONAL'),
    ('5.6', 'Contacto con grupos de interés especial', 'ORGANIZACIONAL'),
    ('5.7', 'Inteligencia de amenazas', 'ORGANIZACIONAL'),
    ('5.8', 'Seguridad de la información en la gestión de proyectos', 'ORGANIZACIONAL'),
    ('5.9', 'Inventario de información y otros activos asociados', 'ORGANIZACIONAL'),
    ('5.10', 'Uso aceptable de la información y otros activos asociados', 'ORGANIZACIONAL'),
    ('5.11', 'Devolución de activos', 'ORGANIZACIONAL'),
    ('5.12', 'Clasificación de la información', 'ORGANIZACIONAL'),
    ('5.13', 'Etiquetado de la información', 'ORGANIZACIONAL'),
    ('5.14', 'Transferencia de información', 'ORGANIZACIONAL'),
    ('5.15', 'Control de acceso', 'ORGANIZACIONAL'),
    ('5.16', 'Gestión de identidades', 'ORGANIZACIONAL'),
    ('5.17', 'Información de autenticación', 'ORGANIZACIONAL'),
    ('5.18', 'Derechos de acceso', 'ORGANIZACIONAL'),
    ('5.19', 'Seguridad de la información en las relaciones con proveedores', 'ORGANIZACIONAL'),
    ('5.20', 'Tratamiento de la seguridad de la información en los acuerdos con proveedores', 'ORGANIZACIONAL'),
    ('5.21', 'Gestión de la seguridad de la información en la cadena de suministro de TIC', 'ORGANIZACIONAL'),
    ('5.22', 'Seguimiento, revisión y gestión de cambios en los servicios de proveedores', 'ORGANIZACIONAL'),
    ('5.23', 'Seguridad de la información para el uso de servicios en la nube', 'ORGANIZACIONAL'),
    ('5.24', 'Planificación y preparación de la gestión de incidentes de seguridad de la información', 'ORGANIZACIONAL'),
    ('5.25', 'Evaluación y decisión sobre eventos de seguridad de la información', 'ORGANIZACIONAL'),
    ('5.26', 'Respuesta a incidentes de seguridad de la información', 'ORGANIZACIONAL'),
    ('5.27', 'Aprendizaje de los incidentes de seguridad de la información', 'ORGANIZACIONAL'),
    ('5.28', 'Recopilación de evidencias', 'ORGANIZACIONAL'),
    ('5.29', 'Seguridad de la información durante la disrupción', 'ORGANIZACIONAL'),
    ('5.30', 'Preparación de las TIC para la continuidad del negocio', 'ORGANIZACIONAL'),
    ('5.31', 'Requisitos legales, estatutarios, reglamentarios y contractuales', 'ORGANIZACIONAL'),
    ('5.32', 'Derechos de propiedad intelectual', 'ORGANIZACIONAL'),
    ('5.33', 'Protección de registros', 'ORGANIZACIONAL'),
    ('5.34', 'Privacidad y protección de datos personales (PII)', 'ORGANIZACIONAL'),
    ('5.35', 'Revisión independiente de la seguridad de la información', 'ORGANIZACIONAL'),
    ('5.36', 'Cumplimiento de políticas, normas y estándares de seguridad de la información', 'ORGANIZACIONAL'),
    ('5.37', 'Procedimientos operativos documentados', 'ORGANIZACIONAL'),
    ('6.1', 'Investigación de antecedentes', 'PERSONAS'),
    ('6.2', 'Términos y condiciones de contratación', 'PERSONAS'),
    ('6.3', 'Concienciación, educación y formación en seguridad de la información', 'PERSONAS'),
    ('6.4', 'Proceso disciplinario', 'PERSONAS'),
    ('6.5', 'Responsabilidades tras la finalización o cambio de empleo', 'PERSONAS'),
    ('6.6', 'Acuerdos de confidencialidad o no divulgación', 'PERSONAS'),
    ('6.7', 'Trabajo remoto', 'PERSONAS'),
    ('6.8', 'Reporte de eventos de seguridad de la información', 'PERSONAS'),
    ('7.1', 'Perímetros de seguridad física', 'FISICO'),
    ('7.2', 'Controles físicos de entrada', 'FISICO'),
    ('7.3', 'Seguridad de oficinas, despachos y recursos', 'FISICO'),
    ('7.4', 'Monitoreo de la seguridad física', 'FISICO'),
    ('7.5', 'Protección contra amenazas físicas y ambientales', 'FISICO'),
    ('7.6', 'Trabajo en áreas seguras', 'FISICO'),
    ('7.7', 'Escritorio y pantalla despejados', 'FISICO'),
    ('7.8', 'Emplazamiento y protección de equipos', 'FISICO'),
    ('7.9', 'Seguridad de los activos fuera de las instalaciones', 'FISICO'),
    ('7.10', 'Soportes de almacenamiento', 'FISICO'),
    ('7.11', 'Servicios de suministro', 'FISICO'),
    ('7.12', 'Seguridad del cableado', 'FISICO'),
    ('7.13', 'Mantenimiento de equipos', 'FISICO'),
    ('7.14', 'Eliminación o reutilización segura de equipos', 'FISICO'),
    ('8.1', 'Dispositivos de punto final de usuario', 'TECNOLOGICO'),
    ('8.2', 'Derechos de acceso privilegiado', 'TECNOLOGICO'),
    ('8.3', 'Restricción de acceso a la información', 'TECNOLOGICO'),
    ('8.4', 'Acceso al código fuente', 'TECNOLOGICO'),
    ('8.5', 'Autenticación segura', 'TECNOLOGICO'),
    ('8.6', 'Gestión de la capacidad', 'TECNOLOGICO'),
    ('8.7', 'Protección contra malware', 'TECNOLOGICO'),
    ('8.8', 'Gestión de vulnerabilidades técnicas', 'TECNOLOGICO'),
    ('8.9', 'Gestión de la configuración', 'TECNOLOGICO'),
    ('8.10', 'Eliminación de información', 'TECNOLOGICO'),
    ('8.11', 'Enmascaramiento de datos', 'TECNOLOGICO'),
    ('8.12', 'Prevención de fuga de datos', 'TECNOLOGICO'),
    ('8.13', 'Copias de seguridad de la información', 'TECNOLOGICO'),
    ('8.14', 'Redundancia de instalaciones de procesamiento de información', 'TECNOLOGICO'),
    ('8.15', 'Registro de eventos (logging)', 'TECNOLOGICO'),
    ('8.16', 'Actividades de monitoreo', 'TECNOLOGICO'),
    ('8.17', 'Sincronización de relojes', 'TECNOLOGICO'),
    ('8.18', 'Uso de programas utilitarios privilegiados', 'TECNOLOGICO'),
    ('8.19', 'Instalación de software en sistemas operativos', 'TECNOLOGICO'),
    ('8.20', 'Seguridad de las redes', 'TECNOLOGICO'),
    ('8.21', 'Seguridad de los servicios de red', 'TECNOLOGICO'),
    ('8.22', 'Segregación de redes', 'TECNOLOGICO'),
    ('8.23', 'Filtrado web', 'TECNOLOGICO'),
    ('8.24', 'Uso de criptografía', 'TECNOLOGICO'),
    ('8.25', 'Ciclo de vida de desarrollo seguro', 'TECNOLOGICO'),
    ('8.26', 'Requisitos de seguridad de las aplicaciones', 'TECNOLOGICO'),
    ('8.27', 'Arquitectura de sistemas segura e ingeniería de principios', 'TECNOLOGICO'),
    ('8.28', 'Codificación segura', 'TECNOLOGICO'),
    ('8.29', 'Pruebas de seguridad en desarrollo y aceptación', 'TECNOLOGICO'),
    ('8.30', 'Desarrollo externalizado', 'TECNOLOGICO'),
    ('8.31', 'Separación de entornos de desarrollo, prueba y producción', 'TECNOLOGICO'),
    ('8.32', 'Gestión de cambios', 'TECNOLOGICO'),
    ('8.33', 'Información de prueba', 'TECNOLOGICO'),
    ('8.34', 'Protección de los sistemas de información durante las pruebas de auditoría', 'TECNOLOGICO'),
]


def seed_controles(apps, schema_editor):
    Control = apps.get_model('controles', 'Control')
    AplicabilidadControl = apps.get_model('controles', 'AplicabilidadControl')
    for codigo, nombre, categoria in CONTROLES:
        control = Control.objects.create(codigo=codigo, nombre=nombre, categoria=categoria)
        AplicabilidadControl.objects.create(control=control)


def unseed_controles(apps, schema_editor):
    Control = apps.get_model('controles', 'Control')
    Control.objects.filter(codigo__in=[c[0] for c in CONTROLES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('controles', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_controles, unseed_controles),
    ]

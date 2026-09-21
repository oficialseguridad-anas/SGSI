from django.db import migrations

# (control_codigo, control_nombre, [(numero, texto), ...]) — Anexo A ISO/IEC 27001:2022,
# controles organizacionales A.5.1 a A.5.37.
CONTROLES = [
    ('A.5.1', 'Políticas para la seguridad de la información', [
        (1, '¿Existe una política de seguridad de la información aprobada por la Dirección?'),
        (2, '¿La política ha sido comunicada al personal y a las partes interesadas pertinentes?'),
        (3, '¿La política se revisa periódicamente o ante cambios significativos?'),
        (4, '¿Existen políticas específicas derivadas de la política general (control de acceso, clasificación, etc.)?'),
    ]),
    ('A.5.2', 'Roles y responsabilidades de seguridad de la información', [
        (1, '¿Están definidos y asignados los roles y responsabilidades de seguridad de la información?'),
        (2, '¿Los responsables conocen formalmente sus funciones (ej. manual de funciones o acta)?'),
        (3, '¿Existe un Oficial de Seguridad de la Información o rol equivalente designado?'),
    ]),
    ('A.5.3', 'Segregación de funciones', [
        (1, '¿Se identifican las funciones o tareas conflictivas que requieren segregación (ej. solicitar y aprobar un mismo acceso)?'),
        (2, '¿Existen controles organizacionales o de sistema que impidan que una sola persona ejecute funciones incompatibles?'),
        (3, '¿Se han detectado incumplimientos a la segregación de funciones en el periodo evaluado?'),
    ]),
    ('A.5.4', 'Responsabilidades de la dirección', [
        (1, '¿La Dirección exige y verifica el cumplimiento de la política de seguridad por parte del personal a su cargo?'),
        (2, '¿Existen evidencias de que los líderes promueven la cultura de seguridad (comunicaciones, reuniones, etc.)?'),
    ]),
    ('A.5.5', 'Contacto con las autoridades', [
        (1, '¿Existe un listado de autoridades relevantes (Policía, MinTIC, entes reguladores, CSIRT, etc.) con datos de contacto vigentes?'),
        (2, '¿Se ha documentado algún contacto con autoridades durante el periodo evaluado, si aplicó?'),
        (3, '¿El personal sabe cuándo y cómo debe contactar a las autoridades ante un incidente?'),
    ]),
    ('A.5.6', 'Contacto con grupos de interés especial', [
        (1, '¿La organización participa o mantiene contacto con grupos, foros o asociaciones de interés especial en seguridad de la información?'),
        (2, '¿Se aprovecha ese contacto para actualizar amenazas, vulnerabilidades o buenas prácticas?'),
    ]),
    ('A.5.7', 'Inteligencia de amenazas', [
        (1, '¿Se recopila o consulta información sobre amenazas relevantes para la organización (boletines, alertas, proveedores)?'),
        (2, '¿Esa información se analiza y se traduce en acciones concretas (ajustes de controles, avisos, etc.)?'),
    ]),
    ('A.5.8', 'Seguridad de la información en la gestión de proyectos', [
        (1, '¿Los proyectos (de TI o de otro tipo) incluyen una evaluación de riesgos de seguridad de la información desde su planeación?'),
        (2, '¿Existen requisitos de seguridad definidos como parte de los entregables o del ciclo de vida del proyecto?'),
    ]),
    ('A.5.9', 'Inventario de información y otros activos asociados', [
        (1, '¿Existe un inventario de activos de información actualizado?'),
        (2, '¿El inventario identifica propietario, custodio y ubicación de cada activo?'),
        (3, '¿El inventario se revisa o actualiza periódicamente (ver Revisión semestral de Activos)?'),
    ]),
    ('A.5.10', 'Uso aceptable de la información y otros activos asociados', [
        (1, '¿Existe una política de uso aceptable de activos de información?'),
        (2, '¿El personal ha aceptado formalmente dicha política?'),
        (3, '¿Se han identificado o gestionado incumplimientos al uso aceptable durante el periodo?'),
    ]),
    ('A.5.11', 'Devolución de activos', [
        (1, '¿Existe un procedimiento para la devolución de activos al finalizar el vínculo o cambiar de cargo?'),
        (2, '¿Se verifica la devolución efectiva de equipos, credenciales y demás activos asignados?'),
    ]),
    ('A.5.12', 'Clasificación de la información', [
        (1, '¿Existe un esquema de clasificación de la información (ej. público, privado, confidencial)?'),
        (2, '¿La información crítica revisada está clasificada conforme al esquema?'),
        (3, '¿El personal conoce el esquema de clasificación y cómo aplicarlo?'),
    ]),
    ('A.5.13', 'Etiquetado de la información', [
        (1, '¿La información clasificada cuenta con un etiquetado o marcación coherente con su clasificación?'),
        (2, '¿El etiquetado se aplica de forma consistente en medios físicos y digitales?'),
    ]),
    ('A.5.14', 'Transferencia de información', [
        (1, '¿Existen reglas o acuerdos para la transferencia segura de información (interna, con terceros, física o electrónica)?'),
        (2, '¿Se usan mecanismos de protección (cifrado, canales seguros) para transferencias de información sensible?'),
        (3, '¿Existen acuerdos de transferencia de información con terceros cuando corresponde?'),
    ]),
    ('A.5.15', 'Control de acceso', [
        (1, '¿Existe una política de control de acceso formalmente documentada?'),
        (2, '¿Los accesos otorgados corresponden al principio de necesidad de conocer / mínimo privilegio?'),
        (3, '¿Se revisan periódicamente los accesos otorgados?'),
    ]),
    ('A.5.16', 'Gestión de identidad', [
        (1, '¿Existe un proceso formal para la creación, modificación y eliminación de identidades/cuentas de usuario?'),
        (2, '¿Cada usuario cuenta con una identidad única (no se comparten cuentas)?'),
        (3, '¿Las identidades de usuarios retirados o inactivos son deshabilitadas oportunamente?'),
    ]),
    ('A.5.17', 'Información de autenticación', [
        (1, '¿Existen lineamientos sobre gestión de contraseñas u otra información de autenticación (longitud, complejidad, vigencia)?'),
        (2, '¿La entrega inicial y el restablecimiento de credenciales se realiza de forma segura?'),
        (3, '¿Se evidencia el uso de mecanismos adicionales de autenticación (MFA) donde corresponde?'),
    ]),
    ('A.5.18', 'Derechos de acceso', [
        (1, '¿El otorgamiento, modificación y revocación de derechos de acceso sigue un proceso formal y autorizado?'),
        (2, '¿Se realizan revisiones periódicas de los derechos de acceso otorgados?'),
        (3, '¿Los accesos privilegiados están identificados y controlados de forma diferenciada?'),
    ]),
    ('A.5.19', 'Seguridad de la información en las relaciones con proveedores', [
        (1, '¿Existe una política o lineamiento de seguridad de la información aplicable a proveedores?'),
        (2, '¿Se evalúan los riesgos de seguridad antes de vincular un proveedor con acceso a información o activos?'),
    ]),
    ('A.5.20', 'Tratamiento de la seguridad de la información en los acuerdos con proveedores', [
        (1, '¿Los contratos o acuerdos con proveedores incluyen cláusulas de seguridad de la información?'),
        (2, '¿Incluyen confidencialidad, niveles de servicio de seguridad y consecuencias por incumplimiento?'),
    ]),
    ('A.5.21', 'Gestión de la seguridad de la información en la cadena de suministro de TIC', [
        (1, '¿Se identifican y gestionan los riesgos de seguridad asociados a la cadena de suministro de TIC (proveedores de software, hardware, servicios)?'),
        (2, '¿Existen requisitos de seguridad exigidos a proveedores críticos de la cadena de suministro?'),
    ]),
    ('A.5.22', 'Seguimiento, revisión y gestión de cambios de los servicios de proveedores', [
        (1, '¿Se monitorea o revisa periódicamente el cumplimiento de seguridad de los proveedores?'),
        (2, '¿Existe un proceso para gestionar cambios en los servicios prestados por proveedores que puedan afectar la seguridad?'),
    ]),
    ('A.5.23', 'Seguridad de la información para el uso de servicios en la nube', [
        (1, '¿Existen lineamientos específicos para el uso seguro de servicios en la nube?'),
        (2, '¿Se evaluaron los riesgos de seguridad y las responsabilidades compartidas antes de contratar servicios en la nube?'),
        (3, '¿Se verifican las condiciones de seguridad de los proveedores cloud utilizados (certificaciones, SLA, ubicación de datos)?'),
    ]),
    ('A.5.24', 'Planificación y preparación de la gestión de incidentes de seguridad de la información', [
        (1, '¿Existe un procedimiento documentado de gestión de incidentes de seguridad de la información?'),
        (2, '¿Están definidos roles, responsabilidades y canales de reporte de incidentes?'),
        (3, '¿El personal conoce el procedimiento de gestión de incidentes?'),
    ]),
    ('A.5.25', 'Evaluación y decisión sobre los eventos de seguridad de la información', [
        (1, '¿Existe un criterio o proceso para evaluar si un evento reportado constituye un incidente de seguridad?'),
        (2, '¿Se evidencia la aplicación de este criterio en los eventos/incidentes registrados en el periodo?'),
    ]),
    ('A.5.26', 'Respuesta a incidentes de seguridad de la información', [
        (1, '¿Los incidentes registrados cuentan con un plan o acciones de respuesta documentadas?'),
        (2, '¿Se hace seguimiento al cierre efectivo de los incidentes (ver Matriz de incidentes)?'),
    ]),
    ('A.5.27', 'Aprendizaje de los incidentes de seguridad de la información', [
        (1, '¿Se analizan los incidentes cerrados para identificar causas raíz y lecciones aprendidas?'),
        (2, '¿Las lecciones aprendidas se traducen en mejoras a controles, políticas o procedimientos?'),
    ]),
    ('A.5.28', 'Recolección de evidencia', [
        (1, '¿Existen lineamientos para la recolección y preservación de evidencia ante incidentes de seguridad?'),
        (2, '¿Se conserva la cadena de custodia de la evidencia cuando el incidente lo amerita?'),
    ]),
    ('A.5.29', 'Seguridad de la información durante la interrupción', [
        (1, '¿Existen planes que consideren la seguridad de la información durante interrupciones o contingencias operativas?'),
        (2, '¿Esos planes se han probado o simulado durante el periodo evaluado?'),
    ]),
    ('A.5.30', 'Preparación de las TIC para la continuidad del negocio', [
        (1, '¿Existe un plan de continuidad de TI (recuperación ante desastres) documentado?'),
        (2, '¿El plan ha sido probado durante el periodo evaluado?'),
        (3, '¿Los tiempos de recuperación (RTO/RPO) están definidos para los servicios críticos?'),
    ]),
    ('A.5.31', 'Requisitos legales, estatutarios, reglamentarios y contractuales', [
        (1, '¿Se han identificado los requisitos legales, estatutarios, reglamentarios y contractuales aplicables a la seguridad de la información (ej. Ley 1581 de 2012)?'),
        (2, '¿Existe evidencia de cumplimiento de dichos requisitos?'),
        (3, '¿Se revisa periódicamente la vigencia y aplicabilidad de estos requisitos?'),
    ]),
    ('A.5.32', 'Derechos de propiedad intelectual', [
        (1, '¿Existen lineamientos para proteger los derechos de propiedad intelectual (software licenciado, desarrollos propios, marcas)?'),
        (2, '¿Se verifica el uso de software licenciado / legal en los equipos de la organización?'),
    ]),
    ('A.5.33', 'Protección de los registros', [
        (1, '¿Existen lineamientos de retención, protección y disposición de los registros de la organización?'),
        (2, '¿Los registros críticos están protegidos contra pérdida, destrucción o alteración no autorizada?'),
    ]),
    ('A.5.34', 'Privacidad y protección de datos personales', [
        (1, '¿Existe una política de tratamiento de datos personales conforme a la Ley 1581 de 2012?'),
        (2, '¿Se cuenta con autorizaciones de tratamiento de datos personales cuando corresponde?'),
        (3, '¿Existe un procedimiento para atender solicitudes de titulares de datos (consulta, reclamo)?'),
    ]),
    ('A.5.35', 'Revisión independiente de la seguridad de la información', [
        (1, '¿Se ha realizado una revisión o auditoría independiente del SGSI en el periodo evaluado?'),
        (2, '¿Los resultados de la revisión independiente derivaron en un plan de acción?'),
    ]),
    ('A.5.36', 'Cumplimiento de las políticas, reglas y normas de seguridad de la información', [
        (1, '¿Se verifica periódicamente que las áreas cumplan las políticas y normas internas de seguridad de la información?'),
        (2, '¿Se han identificado y gestionado incumplimientos internos durante el periodo?'),
    ]),
    ('A.5.37', 'Procedimientos operativos documentados', [
        (1, '¿Los procedimientos operativos críticos (de TI y de otras áreas relevantes) están documentados?'),
        (2, '¿Los procedimientos documentados están vigentes, disponibles y son conocidos por quienes los ejecutan?'),
    ]),
]


def poblar(apps, schema_editor):
    Pregunta = apps.get_model('revisiones', 'PreguntaChecklistOrganizacionales')
    Respuesta = apps.get_model('revisiones', 'RespuestaChecklistOrganizacionales')
    Revision = apps.get_model('revisiones', 'RevisionOrganizacionales')

    preguntas_creadas = []
    for control_codigo, control_nombre, preguntas in CONTROLES:
        for numero, texto in preguntas:
            pregunta, _ = Pregunta.objects.get_or_create(
                control_codigo=control_codigo,
                numero=numero,
                defaults={'control_nombre': control_nombre, 'texto': texto},
            )
            preguntas_creadas.append(pregunta)

    # Si ya existían revisiones antes de poblar el catálogo, les crea la respuesta en
    # blanco correspondiente (mismo criterio que Personas).
    for revision in Revision.objects.all():
        for pregunta in preguntas_creadas:
            Respuesta.objects.get_or_create(revision=revision, pregunta=pregunta)


def revertir(apps, schema_editor):
    Pregunta = apps.get_model('revisiones', 'PreguntaChecklistOrganizacionales')
    Pregunta.objects.filter(control_codigo__in=[c[0] for c in CONTROLES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('revisiones', '0012_preguntachecklistfisicos_and_more'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]

from django.db import migrations

# (control_codigo, control_nombre, [(numero, texto), ...]) — Anexo A ISO/IEC 27001:2022,
# controles tecnológicos A.8.1 a A.8.34.
CONTROLES = [
    ('A.8.1', 'Dispositivos de punto final de usuario', [
        (1, '¿Existen lineamientos de seguridad para los dispositivos de usuario final (equipos, móviles)?'),
        (2, '¿Los dispositivos cuentan con controles mínimos (antivirus, bloqueo de pantalla, cifrado si aplica)?'),
        (3, '¿Se gestionan de forma diferenciada los dispositivos personales usados para trabajo (BYOD), si aplica?'),
    ]),
    ('A.8.2', 'Derechos de acceso privilegiado', [
        (1, '¿Los accesos privilegiados (administradores) están identificados y restringidos a quienes los necesitan?'),
        (2, '¿Se revisan periódicamente los accesos privilegiados otorgados?'),
        (3, '¿Las cuentas privilegiadas son diferentes de las cuentas de uso habitual de esas mismas personas?'),
    ]),
    ('A.8.3', 'Restricción de acceso a la información', [
        (1, '¿El acceso a la información y a las funciones de las aplicaciones está restringido según el perfil del usuario?'),
        (2, '¿Se aplica el principio de mínimo privilegio en los sistemas revisados?'),
    ]),
    ('A.8.4', 'Acceso al código fuente', [
        (1, '¿El acceso al código fuente de los desarrollos propios está restringido y controlado?'),
        (2, '¿Existe un repositorio controlado de código fuente con trazabilidad de cambios?'),
    ]),
    ('A.8.5', 'Autenticación segura', [
        (1, '¿Los sistemas críticos exigen mecanismos de autenticación segura (contraseñas robustas, MFA)?'),
        (2, '¿Se evidencia el uso de autenticación multifactor en accesos remotos o privilegiados?'),
    ]),
    ('A.8.6', 'Gestión de capacidad', [
        (1, '¿Se monitorea la capacidad (almacenamiento, procesamiento, red) de los sistemas críticos?'),
        (2, '¿Existen proyecciones o planes ante el crecimiento de la demanda de recursos?'),
    ]),
    ('A.8.7', 'Protección contra código malicioso', [
        (1, '¿Existe una solución de protección contra malware instalada en los equipos y servidores?'),
        (2, '¿Las firmas/definiciones de la solución antimalware se actualizan regularmente?'),
        (3, '¿Se han registrado incidentes de malware durante el periodo evaluado y cómo se gestionaron?'),
    ]),
    ('A.8.8', 'Gestión de vulnerabilidades técnicas', [
        (1, '¿Existe un proceso de identificación y gestión de vulnerabilidades técnicas (escaneos, parches)?'),
        (2, '¿Se aplican actualizaciones/parches de seguridad de forma oportuna?'),
        (3, '¿Se han identificado vulnerabilidades críticas sin remediar al momento de la revisión?'),
    ]),
    ('A.8.9', 'Gestión de la configuración', [
        (1, '¿Existen configuraciones de seguridad estándar (hardening) para servidores, equipos o dispositivos de red?'),
        (2, '¿Se controla y documenta cualquier cambio a las configuraciones de seguridad?'),
    ]),
    ('A.8.10', 'Eliminación de información', [
        (1, '¿Existen lineamientos para la eliminación segura de información cuando ya no se necesita?'),
        (2, '¿Se evidencia la aplicación de estos lineamientos (ej. depuración de datos, borrado seguro)?'),
    ]),
    ('A.8.11', 'Enmascaramiento de datos', [
        (1, '¿Se aplica enmascaramiento o anonimización de datos sensibles en entornos no productivos (pruebas, desarrollo)?'),
        (2, '¿Existen lineamientos que definan cuándo y cómo aplicar el enmascaramiento de datos?'),
    ]),
    ('A.8.12', 'Prevención de fuga de datos', [
        (1, '¿Existen controles para prevenir la fuga de información (DLP, restricciones de USB, control de correo saliente)?'),
        (2, '¿Se han identificado incidentes de fuga de información durante el periodo?'),
    ]),
    ('A.8.13', 'Copias de respaldo de la información', [
        (1, '¿Existe una política de copias de seguridad (backup) para la información crítica?'),
        (2, '¿Las copias de seguridad se realizan según la periodicidad definida?'),
        (3, '¿Se han realizado pruebas de restauración de las copias de seguridad?'),
    ]),
    ('A.8.14', 'Redundancia de las instalaciones de procesamiento de información', [
        (1, '¿Los sistemas o servicios críticos cuentan con mecanismos de redundancia (servidores, enlaces, energía)?'),
        (2, '¿Se ha probado la conmutación/recuperación ante fallas de estos mecanismos?'),
    ]),
    ('A.8.15', 'Registro (logging)', [
        (1, '¿Los sistemas críticos generan registros (logs) de eventos relevantes de seguridad?'),
        (2, '¿Los logs se protegen contra modificación o eliminación no autorizada?'),
        (3, '¿Existe un tiempo definido de retención de los logs?'),
    ]),
    ('A.8.16', 'Actividades de monitoreo', [
        (1, '¿Se monitorean activamente los sistemas para detectar actividad anómala o no autorizada?'),
        (2, '¿Existen alertas configuradas ante eventos de seguridad relevantes?'),
    ]),
    ('A.8.17', 'Sincronización de relojes', [
        (1, '¿Los relojes de los sistemas y equipos están sincronizados a una fuente de tiempo confiable (NTP)?'),
        (2, '¿La sincronización horaria se verifica periódicamente?'),
    ]),
    ('A.8.18', 'Uso de programas utilitarios privilegiados', [
        (1, '¿El uso de programas utilitarios con capacidad de anular controles del sistema está restringido y controlado?'),
        (2, '¿Se registra y supervisa el uso de estas herramientas privilegiadas?'),
    ]),
    ('A.8.19', 'Instalación de software en sistemas operativos', [
        (1, '¿Existen lineamientos que restringen la instalación de software no autorizado en sistemas operativos/productivos?'),
        (2, '¿Se controla y aprueba formalmente la instalación de software en dichos sistemas?'),
    ]),
    ('A.8.20', 'Seguridad de las redes', [
        (1, '¿Las redes están protegidas mediante controles como firewalls, segmentación o listas de control de acceso?'),
        (2, '¿Se monitorea el tráfico de red para detectar actividad no autorizada?'),
    ]),
    ('A.8.21', 'Seguridad de los servicios de red', [
        (1, '¿Los servicios de red (propios o de terceros) tienen definidos e implementados requisitos de seguridad?'),
        (2, '¿Se verifican periódicamente los niveles de seguridad acordados para servicios de red contratados?'),
    ]),
    ('A.8.22', 'Segregación de redes', [
        (1, '¿Las redes están segmentadas según su función o nivel de sensibilidad (ej. red de usuarios, servidores, invitados)?'),
        (2, '¿Existen controles que impidan el tránsito no autorizado entre segmentos de red?'),
    ]),
    ('A.8.23', 'Filtrado web', [
        (1, '¿Existen controles de filtrado de acceso a sitios web (categorías de riesgo, listas negras)?'),
        (2, '¿Se han identificado intentos de acceso a sitios maliciosos o no autorizados?'),
    ]),
    ('A.8.24', 'Uso de criptografía', [
        (1, '¿Existen lineamientos sobre el uso de cifrado para proteger información sensible (en tránsito y en reposo)?'),
        (2, '¿Se aplican mecanismos de cifrado en los sistemas o comunicaciones que lo requieren?'),
        (3, '¿Existe un proceso de gestión de llaves criptográficas?'),
    ]),
    ('A.8.25', 'Ciclo de vida de desarrollo seguro', [
        (1, '¿Existen lineamientos de seguridad integrados en el ciclo de vida de desarrollo de software?'),
        (2, '¿Se aplican dichos lineamientos en los desarrollos revisados?'),
    ]),
    ('A.8.26', 'Requisitos de seguridad de las aplicaciones', [
        (1, '¿Se definen requisitos de seguridad antes de desarrollar o adquirir una aplicación?'),
        (2, '¿Esos requisitos se verifican antes del paso a producción?'),
    ]),
    ('A.8.27', 'Principios de arquitectura de sistemas seguros', [
        (1, '¿Se aplican principios de arquitectura y diseño seguro en los sistemas desarrollados o implementados?'),
        (2, '¿Existen lineamientos documentados de arquitectura segura de referencia?'),
    ]),
    ('A.8.28', 'Codificación segura', [
        (1, '¿Existen lineamientos de codificación segura para los desarrollos propios?'),
        (2, '¿Se realizan revisiones de código orientadas a identificar fallas de seguridad?'),
    ]),
    ('A.8.29', 'Pruebas de seguridad en desarrollo y aceptación', [
        (1, '¿Se realizan pruebas de seguridad (funcionales o técnicas) antes de pasar un desarrollo a producción?'),
        (2, '¿Los hallazgos de las pruebas de seguridad se remedian antes del despliegue?'),
    ]),
    ('A.8.30', 'Desarrollo subcontratado', [
        (1, '¿Cuando el desarrollo es tercerizado, se exigen requisitos de seguridad al proveedor?'),
        (2, '¿Se supervisa o verifica el cumplimiento de dichos requisitos en desarrollos tercerizados?'),
    ]),
    ('A.8.31', 'Separación de los entornos de desarrollo, prueba y producción', [
        (1, '¿Los entornos de desarrollo, pruebas y producción están separados entre sí?'),
        (2, '¿El acceso entre entornos está controlado (ej. los desarrolladores no tienen acceso directo a producción)?'),
    ]),
    ('A.8.32', 'Gestión de cambios', [
        (1, '¿Existe un proceso formal de gestión de cambios para sistemas de información?'),
        (2, '¿Los cambios significativos se evalúan, aprueban y documentan antes de implementarse?'),
        (3, '¿Existe un procedimiento de reversión (rollback) ante cambios fallidos?'),
    ]),
    ('A.8.33', 'Información de prueba', [
        (1, '¿La información usada en pruebas está protegida o anonimizada cuando proviene de datos reales/productivos?'),
        (2, '¿Existen lineamientos sobre el uso de información de prueba?'),
    ]),
    ('A.8.34', 'Protección de los sistemas de información durante las pruebas de auditoría', [
        (1, '¿Las pruebas de auditoría sobre sistemas operativos se planifican y acuerdan para minimizar impacto?'),
        (2, '¿Se controla y supervisa el acceso otorgado a auditores durante las pruebas?'),
    ]),
]


def poblar(apps, schema_editor):
    Pregunta = apps.get_model('revisiones', 'PreguntaChecklistTecnologicos')
    Respuesta = apps.get_model('revisiones', 'RespuestaChecklistTecnologicos')
    Revision = apps.get_model('revisiones', 'RevisionTecnologicos')

    preguntas_creadas = []
    for control_codigo, control_nombre, preguntas in CONTROLES:
        for numero, texto in preguntas:
            pregunta, _ = Pregunta.objects.get_or_create(
                control_codigo=control_codigo,
                numero=numero,
                defaults={'control_nombre': control_nombre, 'texto': texto},
            )
            preguntas_creadas.append(pregunta)

    for revision in Revision.objects.all():
        for pregunta in preguntas_creadas:
            Respuesta.objects.get_or_create(revision=revision, pregunta=pregunta)


def revertir(apps, schema_editor):
    Pregunta = apps.get_model('revisiones', 'PreguntaChecklistTecnologicos')
    Pregunta.objects.filter(control_codigo__in=[c[0] for c in CONTROLES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('revisiones', '0014_seed_preguntas_fisicos'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]

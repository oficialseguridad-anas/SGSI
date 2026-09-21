from django.db import migrations

# (control_codigo, control_nombre, [(numero, texto), ...]) — Anexo A ISO/IEC 27001:2022,
# controles físicos A.7.1 a A.7.14.
CONTROLES = [
    ('A.7.1', 'Perímetros de seguridad física', [
        (1, '¿Existen perímetros de seguridad física definidos para proteger las áreas con información o activos sensibles?'),
        (2, '¿Los perímetros están debidamente delimitados (paredes, cercas, puertas controladas)?'),
    ]),
    ('A.7.2', 'Controles físicos de entrada', [
        (1, '¿Existen controles de entrada física (tarjetas, biometría, registro de visitantes) en las áreas protegidas?'),
        (2, '¿Se registra y controla el ingreso de visitantes y terceros?'),
        (3, '¿Los controles de acceso físico son proporcionales a la sensibilidad de cada área?'),
    ]),
    ('A.7.3', 'Seguridad de oficinas, recintos e instalaciones', [
        (1, '¿Las oficinas, salas o instalaciones con información sensible cuentan con medidas de seguridad física adicionales?'),
        (2, '¿El acceso a estas áreas está restringido solo al personal autorizado?'),
    ]),
    ('A.7.4', 'Monitoreo de seguridad física', [
        (1, '¿Existen mecanismos de monitoreo físico (CCTV, vigilancia, alarmas) en las instalaciones?'),
        (2, '¿El monitoreo cubre las áreas críticas (centro de datos, archivo, etc.)?'),
        (3, '¿Se conservan los registros de monitoreo por un tiempo definido?'),
    ]),
    ('A.7.5', 'Protección contra amenazas físicas y ambientales', [
        (1, '¿Se han identificado las amenazas físicas y ambientales relevantes (incendio, inundación, sismo, etc.)?'),
        (2, '¿Existen controles para mitigar esas amenazas (extintores, detectores de humo, etc.)?'),
    ]),
    ('A.7.6', 'Trabajo en áreas seguras', [
        (1, '¿Existen lineamientos para trabajar en áreas seguras (ej. prohibición de fotografía, restricciones a visitantes)?'),
        (2, '¿El personal que trabaja en áreas seguras conoce y aplica dichos lineamientos?'),
    ]),
    ('A.7.7', 'Escritorio y pantalla limpios', [
        (1, '¿Existe una política de escritorio y pantalla limpios?'),
        (2, '¿Se evidencia su cumplimiento en las áreas revisadas (documentos guardados, pantallas bloqueadas)?'),
    ]),
    ('A.7.8', 'Ubicación y protección de los equipos', [
        (1, '¿Los equipos están ubicados de forma que se reduzcan riesgos ambientales y de acceso no autorizado?'),
        (2, '¿Existen medidas de protección física adicionales para equipos críticos?'),
    ]),
    ('A.7.9', 'Seguridad de los activos fuera de las instalaciones', [
        (1, '¿Existen lineamientos para proteger los activos que salen de las instalaciones (portátiles, dispositivos móviles)?'),
        (2, '¿Se autoriza formalmente la salida de equipos de la organización?'),
    ]),
    ('A.7.10', 'Medios de almacenamiento', [
        (1, '¿Existen lineamientos para la gestión segura de medios de almacenamiento removibles (USB, discos externos)?'),
        (2, '¿Los medios de almacenamiento se transportan y disponen de forma segura?'),
    ]),
    ('A.7.11', 'Servicios de suministro', [
        (1, '¿Las instalaciones cuentan con respaldo de servicios esenciales (energía, UPS, planta eléctrica, aire acondicionado)?'),
        (2, '¿Estos respaldos se prueban o mantienen periódicamente?'),
    ]),
    ('A.7.12', 'Seguridad del cableado', [
        (1, '¿El cableado eléctrico y de telecomunicaciones está protegido contra daño, interceptación o interferencia?'),
        (2, '¿Existe segregación entre cableado de energía y de datos donde corresponde?'),
    ]),
    ('A.7.13', 'Mantenimiento de equipos', [
        (1, '¿Existe un programa de mantenimiento preventivo/correctivo de equipos?'),
        (2, '¿El mantenimiento se realiza por personal autorizado y queda documentado?'),
    ]),
    ('A.7.14', 'Eliminación o reutilización segura de equipos', [
        (1, '¿Existe un procedimiento para la disposición o reutilización segura de equipos (borrado seguro de información)?'),
        (2, '¿Se verifica que la información fue eliminada antes de dar de baja o reasignar un equipo?'),
    ]),
]


def poblar(apps, schema_editor):
    Pregunta = apps.get_model('revisiones', 'PreguntaChecklistFisicos')
    Respuesta = apps.get_model('revisiones', 'RespuestaChecklistFisicos')
    Revision = apps.get_model('revisiones', 'RevisionFisicos')

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
    Pregunta = apps.get_model('revisiones', 'PreguntaChecklistFisicos')
    Pregunta.objects.filter(control_codigo__in=[c[0] for c in CONTROLES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('revisiones', '0013_seed_preguntas_organizacionales'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]

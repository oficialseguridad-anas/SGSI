from django.db import migrations

CONTROL_CODIGO = 'A.6.8'
CONTROL_NOMBRE = 'Informes de eventos de seguridad de la información'

PREGUNTAS = [
    (1, '¿La persona sabe qué se considera un evento o situación sospechosa?'),
    (2, '¿Conoce el canal institucional de reporte?'),
    (3, '¿Sabe a quién reportar y que debe hacerlo oportunamente?'),
    (4, '¿El canal está disponible y es fácil de utilizar?'),
    (5, '¿Existen registros de eventos/incidentes reportados por personal cuando han ocurrido?'),
    (6, '¿La organización mide o revisa la oportunidad y efectividad del reporte?'),
]


def poblar(apps, schema_editor):
    PreguntaChecklistPersonas = apps.get_model('revisiones', 'PreguntaChecklistPersonas')
    RespuestaChecklistPersonas = apps.get_model('revisiones', 'RespuestaChecklistPersonas')
    RevisionPersonas = apps.get_model('revisiones', 'RevisionPersonas')

    preguntas_creadas = []
    for numero, texto in PREGUNTAS:
        pregunta, _ = PreguntaChecklistPersonas.objects.get_or_create(
            control_codigo=CONTROL_CODIGO,
            numero=numero,
            defaults={'control_nombre': CONTROL_NOMBRE, 'texto': texto},
        )
        preguntas_creadas.append(pregunta)

    for revision in RevisionPersonas.objects.all():
        for pregunta in preguntas_creadas:
            RespuestaChecklistPersonas.objects.get_or_create(revision=revision, pregunta=pregunta)


def revertir(apps, schema_editor):
    PreguntaChecklistPersonas = apps.get_model('revisiones', 'PreguntaChecklistPersonas')
    PreguntaChecklistPersonas.objects.filter(control_codigo=CONTROL_CODIGO).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('revisiones', '0010_seed_preguntas_a67'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]

from django.db import migrations

CONTROL_CODIGO = 'A.6.7'
CONTROL_NOMBRE = 'Trabajo remoto'

PREGUNTAS = [
    (1, '¿La persona está autorizada formalmente para acceso remoto?'),
    (2, '¿El acceso se realiza mediante mecanismo autorizado (por ejemplo, VPN)?'),
    (3, '¿Está habilitado MFA cuando corresponde?'),
    (4, '¿Se utiliza equipo corporativo o mecanismo controlado según la política?'),
    (5, '¿Se aplica mínimo privilegio y restricción de origen cuando corresponda?'),
    (6, '¿Las conexiones remotas se registran y monitorean?'),
    (7, '¿La persona conoce las restricciones sobre redes públicas, almacenamiento local y equipos personales?'),
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
        ('revisiones', '0009_seed_preguntas_a66'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]

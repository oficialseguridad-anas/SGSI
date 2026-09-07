from django.db import migrations

CONTROL_CODIGO = 'A.6.6'
CONTROL_NOMBRE = 'Acuerdos de confidencialidad o no divulgación'

PREGUNTAS = [
    (1, '¿Existe acuerdo de confidencialidad firmado por la persona?'),
    (2, '¿Fue suscrito antes o al inicio del acceso a información sensible?'),
    (3, '¿Establece duración y obligaciones posteriores a la terminación?'),
    (4, '¿Incluye devolución/destrucción de información y medidas ante incumplimiento?'),
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
        ('revisiones', '0008_seed_preguntas_a65'),
    ]

    operations = [
        migrations.RunPython(poblar, revertir),
    ]
